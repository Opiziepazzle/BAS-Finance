const loanService = require('../services/LoanService');
const sequelize = require('../database/db');

describe('LoanService', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('should generate a correct repayment schedule for Example 1', () => {
    const loan = {
      principal: 120000000,
      annualRate: 18,
      termMonths: 6,
      disbursementDate: '2026-01-01'
    };

    const schedule = loanService.generateSchedule(loan);

    expect(schedule).toHaveLength(6);
    expect(schedule[0].totalInstalment).toBe(21063026);
    expect(schedule[0].interest).toBe(1800000);
    expect(schedule[0].principal).toBe(19263026);
    expect(schedule[0].closingBalance).toBe(100736974);

    expect(schedule[5].closingBalance).toBe(0);
    expect(schedule[5].totalInstalment).toBe(20751748 + 311276);
  });
});
