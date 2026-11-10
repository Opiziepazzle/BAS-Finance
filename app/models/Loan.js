const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  principal: {
    type: DataTypes.BIGINT, // in kobo
    allowNull: false,
  },
  annualRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
  },
  termMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  disbursementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'closed'),
    defaultValue: 'active',
  },
});

module.exports = Loan;
