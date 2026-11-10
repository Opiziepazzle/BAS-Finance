# Lending & Accounting Engine

A high-precision lending engine and double-entry ledger system built with Node.js, Express, and PostgreSQL. This project handles loan lifecycle management, invoice financing calculations, and maintains an immutable, balanced financial ledger.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL

### Installation
1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd lending-engine
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment variables in a `.env` file (see `.env.example`):
   ```env
   PORT=3000
   DB_NAME=your_db
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   JWT_KEY=your_secret_key
   ```

### Running the Service
```bash
npm start
```

### Running Tests
```bash
npm test
```

## 🛠 Features

### 1. Lending Engine (Term Loans)
- **Schedule Generator**: Monthly reducing-balance annuity calculations matching worked examples to the kobo.
- **Payment Waterfall**: Strict repayment allocation order (Interest -> Principal).
- **Accrual Job**: Automated interest income recognition when instalments fall due.

### 2. Invoice Financing
- **Quote Calculator**: Advanced calculations for reserves, discount fees, and late penalties (0.2% per day).
- **Settlement Logic**: Handles full lifecycle from disbursement to settlement with appropriate ledger postings.

### 3. Double-Entry Ledger
- **Atomic Posting**: All money movements are posted to a balanced ledger (Debits = Credits).
- **Immutability**: Entries cannot be edited or deleted; corrections are handled via linked reversals.
- **Trial Balance**: Real-time account totals and net balance verification.

## 📂 Project Structure

```text
lending-engine/
├── app/
│   ├── controllers/            # Request handlers (The "Waiters")
│   │   ├── InvoiceController.js
│   │   ├── LedgerController.js
│   │   └── LoanController.js
│   ├── database/               # Database connection & config
│   │   └── db.js
│   ├── middleware/             # Security & Error guards
│   │   ├── checkAuth.js
│   │   └── ErrorHandler.middleware.js
│   ├── models/                 # Database blueprints (Sequelize)
│   │   ├── index.js
│   │   ├── Invoice.js
│   │   ├── LedgerEntry.js
│   │   ├── LedgerLine.js
│   │   ├── Loan.js
│   │   └── RepaymentSchedule.js
│   ├── routes/                 # API endpoint definitions
│   │   ├── invoice.routes.js
│   │   ├── job.routes.js
│   │   ├── ledger.routes.js
│   │   └── loan.routes.js
│   ├── services/               # Core business logic (The "Brains")
│   │   ├── InvoiceService.js
│   │   ├── LedgerService.js
│   │   └── LoanService.js
│   └── tests/                  # Automated unit tests
│       ├── invoiceService.test.js
│       └── loanService.test.js
├── .env                        # Local environment variables (Gitignored)
├── .env.example                # Template for environment variables
├── .gitignore                  # Files to exclude from Git
├── NOTES.md                    # Technical assumptions & notes
├── package.json                # Project dependencies & scripts
├── README.md                   # Project overview & documentation
└── server.js                   # Application entry point
```

## 🔒 Security
- All core routes are protected via JWT authentication middleware.
- Database transactions ensure financial data integrity (no half-posted states).

## 📝 Documentation
For detailed assumptions and implementation choices, see [NOTES.md](NOTES.md).
