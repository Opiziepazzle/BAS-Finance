const { Decimal } = require('decimal.js');
const { DateTime } = require('luxon');

const { Invoice } = require('../models');
const ledgerService = require('./LedgerService');
const sequelize = require('../database/db');

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

class InvoiceService {
  async disburseInvoice(data) {
    const { faceValue, advanceRate, annualRate, tenorDays, disbursementDate } = data;

    const quote = this.calculateQuote({ faceValue, advanceRate, annualRate, tenorDays });

    const t = await sequelize.transaction();
    try {
      const invoice = await Invoice.create({
        faceValue,
        advanceRate,
        annualRate,
        tenorDays,
        disbursementDate,
      }, { transaction: t });

      // Posting rule: Dr Invoice Receivables; Cr Cash
      await ledgerService.postEntry({
        description: `Invoice Advance for Invoice ${invoice.id}`,
        referenceId: invoice.id,
        referenceType: 'Invoice',
        lines: [
          { accountName: 'Invoice Receivables', amount: quote.advance, direction: 'debit' },
          { accountName: 'Cash', amount: quote.advance, direction: 'credit' },
        ],
      }, t);

      await t.commit();
      return { invoice, quote };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async settleInvoice(invoiceId, settlementDate) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'settled') throw new Error('Invoice already settled');

    const quote = this.calculateQuote({
      faceValue: invoice.faceValue,
      advanceRate: invoice.advanceRate,
      annualRate: invoice.annualRate,
      tenorDays: invoice.tenorDays,
      disbursementDate: invoice.disbursementDate,
      settlementDate,
    });

    const t = await sequelize.transaction();
    try {
      // Entry: Dr Cash (face value); 
      // Cr Invoice Receivables (advance); Cr Fee Income; Cr Penalty Income; 
      // Cr Client Payable (if amountPayableToClient > 0)
      // OR Dr Client Receivable (if shortfall > 0)

      const lines = [
        { accountName: 'Cash', amount: invoice.faceValue, direction: 'debit' },
        { accountName: 'Invoice Receivables', amount: quote.advance, direction: 'credit' },
        { accountName: 'Fee Income', amount: quote.discountFee, direction: 'credit' },
        { accountName: 'Penalty Income', amount: quote.latePenalty, direction: 'credit' },
      ];

      if (quote.amountPayableToClient > 0) {
        lines.push({ accountName: 'Client Payable', amount: quote.amountPayableToClient, direction: 'credit' });
      } else if (quote.shortfall > 0) {
        lines.push({ accountName: 'Client Receivable', amount: quote.shortfall, direction: 'debit' });
      }

      await ledgerService.postEntry({
        description: `Invoice Settlement for Invoice ${invoice.id}`,
        referenceId: invoice.id,
        referenceType: 'Invoice',
        lines: lines.filter(l => l.amount > 0),
      }, t);

      await invoice.update({ status: 'settled', settlementDate }, { transaction: t });

      await t.commit();
      return { invoice, quote };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  calculateQuote(data) {
    const { faceValue, advanceRate, annualRate, tenorDays, settlementDate, disbursementDate } = data;

    const FV = new Decimal(faceValue.toString());
    const AR = new Decimal(advanceRate.toString()); // e.g. 0.80
    const AnnRate = new Decimal(annualRate.toString()).dividedBy(100);
    const Tenor = new Decimal(tenorDays.toString());

    const advance = FV.times(AR).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    const reserve = FV.minus(advance);

    // Discount fee = advance × annual rate × tenor days / 365
    const discountFee = advance.times(AnnRate).times(Tenor).dividedBy(365).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

    let latePenalty = new Decimal(0);
    let overdueDays = 0;

    if (settlementDate && disbursementDate) {
      const disDate = DateTime.fromISO(disbursementDate);
      const setDate = DateTime.fromISO(settlementDate);
      const dueDate = disDate.plus({ days: tenorDays });
      
      const diff = setDate.diff(dueDate, 'days').days;
      if (diff > 0) {
        overdueDays = Math.floor(diff);
        // Late penalty = advance × 0.2% × days overdue
        latePenalty = advance.times(0.002).times(overdueDays).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      }
    }

    const totalCharges = discountFee.plus(latePenalty);
    const amountPayableToClient = reserve.minus(totalCharges);

    return {
      advance: advance.toNumber(),
      reserve: reserve.toNumber(),
      discountFee: discountFee.toNumber(),
      latePenalty: latePenalty.toNumber(),
      overdueDays,
      amountPayableToClient: amountPayableToClient.toNumber(),
      shortfall: amountPayableToClient.isNegative() ? amountPayableToClient.abs().toNumber() : 0,
    };
  }
}

module.exports = new InvoiceService();
