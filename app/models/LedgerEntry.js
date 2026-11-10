const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const LedgerEntry = sequelize.define('LedgerEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  referenceType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reversalOfId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  postedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = LedgerEntry;
