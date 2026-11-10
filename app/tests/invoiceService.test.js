const invoiceService = require('../services/InvoiceService');
const sequelize = require('../database/db');

describe('InvoiceService', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('should calculate a correct quote for Example 2', () => {
    const data = {
      faceValue: 1000000000,
      advanceRate: 0.8,
      annualRate: 36,
      tenorDays: 60,
      disbursementDate: '2026-01-01',
      settlementDate: '2026-03-02' // 60 days exactly? 31 (Jan) + 28 (Feb) = 59. March 2 is 60.
    };

    const quote = invoiceService.calculateQuote(data);

    expect(quote.advance).toBe(800000000);
    expect(quote.reserve).toBe(200000000);
    expect(quote.discountFee).toBe(47342466);
    expect(quote.latePenalty).toBe(0);
  });

  test('should calculate late penalty correctly', () => {
    const data = {
      faceValue: 1000000000,
      advanceRate: 0.8,
      annualRate: 36,
      tenorDays: 60,
      disbursementDate: '2026-01-01',
      settlementDate: '2026-03-12' // 10 days late
    };

    const quote = invoiceService.calculateQuote(data);
    expect(quote.latePenalty).toBe(16000000);
  });
});
