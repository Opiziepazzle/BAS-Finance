const Loan = require('./Loan');
const RepaymentSchedule = require('./RepaymentSchedule');
const Invoice = require('./Invoice');
const LedgerEntry = require('./LedgerEntry');
const LedgerLine = require('./LedgerLine');

// Associations
Loan.hasMany(RepaymentSchedule, { foreignKey: 'loanId' });
RepaymentSchedule.belongsTo(Loan, { foreignKey: 'loanId' });

LedgerEntry.hasMany(LedgerLine, { foreignKey: 'entryId', as: 'lines' });
LedgerLine.belongsTo(LedgerEntry, { foreignKey: 'entryId' });

LedgerEntry.belongsTo(LedgerEntry, { as: 'reversalOf', foreignKey: 'reversalOfId' });

module.exports = {
  Loan,
  RepaymentSchedule,
  Invoice,
  LedgerEntry,
  LedgerLine,
};
