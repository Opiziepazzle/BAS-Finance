const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  faceValue: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  advanceRate: {
    type: DataTypes.DECIMAL(5, 2), // e.g. 0.80
    allowNull: false,
  },
  annualRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
  tenorDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  disbursementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  settlementDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'settled'),
    defaultValue: 'pending',
  },
});

module.exports = Invoice;
