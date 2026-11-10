const { LedgerEntry, LedgerLine } = require('../models');
const sequelize = require('../database/db');

class LedgerService {
  /**
   * Posts a journal entry to the ledger.
   * @param {Object} entryData - { description, referenceId, referenceType, lines }
   * @param {Array} entryData.lines - [{ accountName, amount, direction }]
   * @param {Object} [transaction] - Optional Sequelize transaction
   */
  async postEntry(entryData, transaction) {
    const { description, referenceId, referenceType, lines } = entryData;

    if (!lines || lines.length < 2) {
      throw new Error('An entry must have at least 2 lines.');
    }

    let totalDebit = 0n;
    let totalCredit = 0n;

    for (const line of lines) {
      if (line.amount <= 0) continue; // Lines with zero amount are not posted
      
      const amount = BigInt(line.amount);
      if (line.direction === 'debit') {
        totalDebit += amount;
      } else if (line.direction === 'credit') {
        totalCredit += amount;
      } else {
        throw new Error('Invalid direction. Must be "debit" or "credit".');
      }
    }

    if (totalDebit !== totalCredit) {
      throw new Error(`Entry does not balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }

    const t = transaction || (await sequelize.transaction());

    try {
      const entry = await LedgerEntry.create({
        description,
        referenceId,
        referenceType,
      }, { transaction: t });

      const linesToCreate = lines
        .filter(line => line.amount > 0)
        .map(line => ({
          entryId: entry.id,
          accountName: line.accountName,
          amount: line.amount,
          direction: line.direction,
        }));

      await LedgerLine.bulkCreate(linesToCreate, { transaction: t });

      if (!transaction) await t.commit();
      return entry;
    } catch (error) {
      if (!transaction) await t.rollback();
      throw error;
    }
  }

  async reverseEntry(entryId) {
    const t = await sequelize.transaction();
    try {
      const originalEntry = await LedgerEntry.findByPk(entryId, {
        include: [{ model: LedgerLine, as: 'lines' }],
        transaction: t,
      });

      if (!originalEntry) throw new Error('Entry not found.');

      // Check if already reversed
      const existingReversal = await LedgerEntry.findOne({
        where: { reversalOfId: entryId },
        transaction: t,
      });
      if (existingReversal) throw new Error('Entry already reversed.');

      const reversedLines = originalEntry.lines.map(line => ({
        accountName: line.accountName,
        amount: line.amount,
        direction: line.direction === 'debit' ? 'credit' : 'debit',
      }));

      const reversalEntry = await this.postEntry({
        description: `Reversal of entry ${entryId}`,
        referenceId: originalEntry.referenceId,
        referenceType: originalEntry.referenceType,
        lines: reversedLines,
      }, t);

      originalEntry.reversalOfId = reversalEntry.id; // Optional: Link back or just leave as is
      // Brief says: "creates a new entry with every line flipped and a link to the original"
      // So I'll set the reversalOfId on the NEW entry.
      await reversalEntry.update({ reversalOfId: entryId }, { transaction: t });

      await t.commit();
      return reversalEntry;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getTrialBalance() {
    const lines = await LedgerLine.findAll({
      attributes: [
        'accountName',
        'direction',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
      ],
      group: ['accountName', 'direction'],
    });

    const balanceMap = {};
    let grandTotalDebit = 0n;
    let grandTotalCredit = 0n;

    lines.forEach(line => {
      const name = line.accountName;
      const amount = BigInt(line.get('total'));
      const direction = line.direction;

      if (!balanceMap[name]) {
        balanceMap[name] = { debits: 0n, credits: 0n, net: 0n };
      }

      if (direction === 'debit') {
        balanceMap[name].debits += amount;
        grandTotalDebit += amount;
      } else {
        balanceMap[name].credits += amount;
        grandTotalCredit += amount;
      }
    });

    // Net calculation: Assets/Expenses (Dr - Cr), Liabilities/Equity/Income (Cr - Dr)
    // Actually, trial balance usually just shows Dr and Cr and Net (Dr - Cr).
    const results = Object.keys(balanceMap).map(name => {
      const { debits, credits } = balanceMap[name];
      return {
        accountName: name,
        debits: debits.toString(),
        credits: credits.toString(),
        net: (debits - credits).toString(),
      };
    });

    return {
      accounts: results,
      totals: {
        debits: grandTotalDebit.toString(),
        credits: grandTotalCredit.toString(),
        net: (grandTotalDebit - grandTotalCredit).toString(),
      },
    };
  }
}

module.exports = new LedgerService();
