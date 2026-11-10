const ledgerService = require('../services/LedgerService');

exports.reverseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ledgerService.reverseEntry(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTrialBalance = async (req, res) => {
  try {
    const result = await ledgerService.getTrialBalance();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
