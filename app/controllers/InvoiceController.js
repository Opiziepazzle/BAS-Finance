const invoiceService = require('../services/InvoiceService');

exports.getQuote = async (req, res) => {
  try {
    const { faceValue, advanceRate, annualRate, tenorDays, settlementDate, disbursementDate } = req.body;
    const result = invoiceService.calculateQuote({ faceValue, advanceRate, annualRate, tenorDays, settlementDate, disbursementDate });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.disburse = async (req, res) => {
  try {
    const { faceValue, advanceRate, annualRate, tenorDays, disbursementDate } = req.body;
    const result = await invoiceService.disburseInvoice({ faceValue, advanceRate, annualRate, tenorDays, disbursementDate });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.settle = async (req, res) => {
  try {
    const { id } = req.params;
    const { settlementDate } = req.body;
    const result = await invoiceService.settleInvoice(id, settlementDate);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
