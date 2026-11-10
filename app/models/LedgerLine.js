const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const LedgerLine = sequelize.define('LedgerLine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  direction: {
    type: DataTypes.ENUM('debit', 'credit'),
    allowNull: false,
  },
});

module.exports = LedgerLine;
