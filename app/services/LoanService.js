const { Loan, RepaymentSchedule } = require('../models');
const { Decimal } = require('decimal.js');
const { DateTime } = require('luxon');
const ledgerService = require('./LedgerService');
const sequelize = require('../database/db');

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

class LoanService {
  async createLoan(data) {
    const { principal, annualRate, termMonths, disbursementDate } = data;

    // Validation
    if (principal <= 0) throw new Error('Principal must be positive');
    if (annualRate <= 0) throw new Error('Annual rate must be positive');
    if (termMonths <= 0) throw new Error('Term months must be positive');

    const t = await sequelize.transaction();
    try {
      const loan = await Loan.create({
        principal,
        annualRate,
        termMonths,
        disbursementDate,
      }, { transaction: t });

      const schedule = this.generateSchedule(loan);
      
      await RepaymentSchedule.bulkCreate(schedule.map(s => ({
        ...s,
        loanId: loan.id,
      })), { transaction: t });

      // Post disbursement entry: Dr Loans Receivable; Cr Cash
      await ledgerService.postEntry({
        description: `Disbursement for Loan ${loan.id}`,
        referenceId: loan.id,
        referenceType: 'Loan',
        lines: [
          { accountName: 'Loans Receivable', amount: principal, direction: 'debit' },
          { accountName: 'Cash', amount: principal, direction: 'credit' },
        ],
      }, t);

      await t.commit();
      return { loan, schedule };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  generateSchedule(loan) {
    const P = new Decimal(loan.principal.toString());
    const annualRate = new Decimal(loan.annualRate.toString());
    const i = annualRate.dividedBy(100).dividedBy(12); // i = annual rate / 12 (nominal)
    const n = loan.termMonths;

    // Instalment = P * i / (1 - (1 + i)^-n)
    let instalment;
    if (i.isZero()) {
      instalment = P.dividedBy(n).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    } else {
      const numerator = P.times(i);
      const denominator = new Decimal(1).minus(new Decimal(1).plus(i).pow(-n));
      instalment = numerator.dividedBy(denominator).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    }

    const schedule = [];
    let openingBalance = P;
    const startDate = DateTime.fromISO(loan.disbursementDate);

    for (let period = 1; period <= n; period++) {
      const dueDate = startDate.plus({ months: period }).toISODate();
      let interest;
      let principal;
      let payment;

      if (period === n) {
        // Final instalment clears the balance
        interest = openingBalance.times(i).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
        principal = openingBalance;
        payment = principal.plus(interest);
      } else {
        interest = openingBalance.times(i).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
        principal = instalment.minus(interest);
        payment = instalment;
      }

      const closingBalance = openingBalance.minus(principal);

      schedule.push({
        instalmentNumber: period,
        dueDate,
        totalInstalment: payment.toNumber(),
        interest: interest.toNumber(),
        principal: principal.toNumber(),
        closingBalance: closingBalance.toNumber(),
      });

      openingBalance = closingBalance;
    }

    return schedule;
  }

  async accrueInterest(asOfDate) {
    const schedules = await RepaymentSchedule.findAll({
      where: {
        dueDate: { [sequelize.Sequelize.Op.lte]: asOfDate },
        accrued: false,
      },
      include: [Loan],
    });

    const entries = [];
    for (const schedule of schedules) {
      const t = await sequelize.transaction();
      try {
        // Dr Interest Receivable; Cr Interest Income
        await ledgerService.postEntry({
          description: `Interest Accrual for Loan ${schedule.loanId}, Instalment ${schedule.instalmentNumber}`,
          referenceId: schedule.id,
          referenceType: 'RepaymentSchedule',
          lines: [
            { accountName: 'Interest Receivable', amount: schedule.interest, direction: 'debit' },
            { accountName: 'Interest Income', amount: schedule.interest, direction: 'credit' },
          ],
        }, t);

        await schedule.update({ accrued: true }, { transaction: t });
        await t.commit();
        entries.push(schedule.id);
      } catch (error) {
        await t.rollback();
        console.error(`Failed to accrue interest for schedule ${schedule.id}:`, error);
      }
    }
    return entries;
  }

  async processPayment(loanId, amount, paymentDate) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status === 'closed') throw new Error('Loan is already closed');
    if (paymentDate < loan.disbursementDate) throw new Error('Payment before disbursement is not allowed');

    const t = await sequelize.transaction();
    try {
      let remainingPayment = BigInt(amount);
      const ledgerLines = [
        { accountName: 'Cash', amount: amount, direction: 'debit' },
      ];

      const schedules = await RepaymentSchedule.findAll({
        where: { loanId, status: { [sequelize.Sequelize.Op.ne]: 'paid' } },
        order: [['dueDate', 'ASC']],
        transaction: t,
      });

      for (const schedule of schedules) {
        if (remainingPayment <= 0n) break;

        const penaltyDue = BigInt(schedule.penalty || 0);
        const feeDue = BigInt(schedule.fee || 0);
        const interestDue = BigInt(schedule.interest);
        const principalDue = BigInt(schedule.principal);
        const alreadyPaid = BigInt(schedule.amountPaid || 0);
        
        // Full Waterfall: Penalty -> Fee -> Interest -> Principal
        let remainingPenalty = penaltyDue;
        let remainingFee = feeDue;
        let remainingInterest = interestDue;
        let remainingPrincipal = principalDue;

        // Deduct what was already paid from the waterfall
        let tempAlreadyPaid = alreadyPaid;
        
        const applyPaid = (due) => {
          const paid = tempAlreadyPaid >= due ? due : tempAlreadyPaid;
          tempAlreadyPaid -= paid;
          return due - paid;
        };

        remainingPenalty = applyPaid(penaltyDue);
        remainingFee = applyPaid(feeDue);
        remainingInterest = applyPaid(interestDue);
        remainingPrincipal = applyPaid(principalDue);

        // Apply new payment to remaining dues
        const pay = (remaining, accountName, direction) => {
          if (remainingPayment > 0n && remaining > 0n) {
            const toPay = remainingPayment >= remaining ? remaining : remainingPayment;
            ledgerLines.push({ accountName, amount: Number(toPay), direction });
            remainingPayment -= toPay;
            return remaining - toPay;
          }
          return remaining;
        };

        remainingPenalty = pay(remainingPenalty, 'Penalty Receivable', 'credit');
        remainingFee = pay(remainingFee, 'Fee Receivable', 'credit');
        remainingInterest = pay(remainingInterest, 'Interest Receivable', 'credit');
        remainingPrincipal = pay(remainingPrincipal, 'Loans Receivable', 'credit');

        // Update schedule status
        const totalPaidNow = (penaltyDue + feeDue + interestDue + principalDue) - 
                            (remainingPenalty + remainingFee + remainingInterest + remainingPrincipal);
        
        if (remainingPenalty === 0n && remainingFee === 0n && remainingInterest === 0n && remainingPrincipal === 0n) {
          await schedule.update({ status: 'paid', amountPaid: Number(totalPaidNow) }, { transaction: t });
        } else {
          await schedule.update({ status: 'partial', amountPaid: Number(totalPaidNow) }, { transaction: t });
        }
      }

      if (remainingPayment > 0n) {
        ledgerLines.push({ accountName: 'Unapplied Credit', amount: Number(remainingPayment), direction: 'credit' });
      }

      await ledgerService.postEntry({
        description: `Payment for Loan ${loan.id}`,
        referenceId: loan.id,
        referenceType: 'Loan',
        lines: ledgerLines.filter(l => l.amount > 0),
      }, t);

      const unpaidSchedules = await RepaymentSchedule.count({
        where: { loanId, status: { [sequelize.Sequelize.Op.ne]: 'paid' } },
        transaction: t,
      });
      if (unpaidSchedules === 0) {
        await loan.update({ status: 'closed' }, { transaction: t });
      }

      await t.commit();
      return { remainingPayment: remainingPayment.toString() };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = new LoanService();
