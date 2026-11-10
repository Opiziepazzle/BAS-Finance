# Project Notes: Lending & Accounting Engine



1.  **Term Loan Penalties/Fees**: The waterfall rule mentions penalties and fees, but the brief does not define them for Product B (Term Loans). I have implemented the waterfall such that it handles them if they exist, but for this assessment, only Interest and Principal are applied to term loan instalments.
2.  **Interest Accrual**: Interest becomes income when its instalment falls due. The `/jobs/accrue` endpoint handles this by checking all schedules where `dueDate <= asOf` and posting the accrual entry (Dr Interest Receivable, Cr Interest Income).
3.  **Payment Allocation**: Surplus payments are moved to `Unapplied Credit` (Liability) as specified.
4.  **Money Handling**: All amounts are handled as `BigInt` (kobo) or `Decimal` (for calculations) to avoid float drift. Rounding is half-up to the nearest kobo as required.
5.  **Invoice Financing**: Late penalty is calculated as `advance * 0.002 * overdue_days`. Overdue days start the day after the due date.

## Verification

### Manual Verification
- **Term Loan Schedule**: Verified against Example 1. P=120,000,000, 18% annual, 6 months. Instalment calculated as 21,063,026 kobo. Final instalment adjusted to clear balance.
- **Invoice Financing**: Verified against Example 2. Face value 1,000,000,000, Advance 800,000,000, 36% rate, 60 days. Discount fee = 47,342,466. Late penalty (10 days) = 16,000,000.
- **Double Entry Ledger**: Verified that every entry has balanced debits and credits. Reversals create new entries with flipped directions.

### Automated Tests
- Unit tests cover the core logic in `LoanService`, `InvoiceService`, and `LedgerService`.


