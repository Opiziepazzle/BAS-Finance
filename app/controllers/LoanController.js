const loanService = require('../services/LoanService');

exports.createLoan = async (req, res) => {
  try {
    const { principal, annualRate, termMonths, disbursementDate } = req.body;
    const result = await loanService.createLoan({ principal, annualRate, termMonths, disbursementDate });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentDate } = req.body;
    const result = await loanService.processPayment(id, amount, paymentDate);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.accrueInterest = async (req, res) => {
  try {
    const { asOf } = req.query;
    if (!asOf) return res.status(400).json({ error: 'asOf date is required' });
    const result = await loanService.accrueInterest(asOf);
    res.status(200).json({ accruedSchedules: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
