const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const RepaymentSchedule = sequelize.define('RepaymentSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  instalmentNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  totalInstalment: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  interest: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  penalty: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  fee: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
  },
  principal: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  closingBalance: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'partial'),
    defaultValue: 'unpaid',
  },
  amountPaid: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  },
  accrued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = RepaymentSchedule;
