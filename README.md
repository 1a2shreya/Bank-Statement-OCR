# Bank Statement OCR & Transaction Extractor

A complete, production-quality AI-powered Bank Statement OCR web application built with React, TypeScript, Tailwind CSS, Express, and Google Gemini.

## Features

- **Multi-Format Ingestion**: Upload PDF bank statements (digital and scanned), JPG, JPEG, and PNG images.
- **Multimodal AI Vision & OCR**: Accurately recognizes diverse statement formats, multi-column tables, headers, UPI references, NEFT/IMPS/RTGS transaction codes, ATM cash withdrawals, EMI installments, salaries, and interest credits.
- **Strict Table Schema**: Extracts exactly:
  1. **Date** (DD/MM/YYYY)
  2. **Description** (Cleaned of OCR noise, preserving transaction IDs)
  3. **Amount** (Signed numeric: negative for debits/expenses, positive for credits/income)
  4. **Category** (Contextual classification into 18 categories: Food, Shopping, Income, Bills & Utilities, Rent, Healthcare, ATM/Cash Withdrawal, EMI/Loan, etc.)
  5. **Notes** (Contextual summary without hallucinations)
- **Interactive Editing**:
  - In-place cell editing for all fields with real-time feedback
  - Row deletion and addition
  - Revert / Reset manual edits to original OCR extraction
- **Quality Assurance & "Needs Review" Flags**:
  - Automatically flags rows with low confidence or ambiguous dates/amounts
  - 1-click filter for rows requiring review
  - "Mark as Reviewed" action
- **Financial Metrics Dashboard**:
  - Total Transactions count
  - Total Income
  - Total Expenses
  - Net Balance
- **RFC 4180 Compliant CSV Export**:
  - Exact header: `Date,Description,Amount,Category,Notes`
  - Proper quote escaping for fields containing commas or quotes
  - One-click copy to clipboard and downloadable file
- **Data Privacy by Design**:
  - In-memory processing; files are never permanently saved to disk
  - PII (account numbers, IFSC, PAN, address) sanitized and strictly excluded from CSV export.

## Quick Start

### 1. Configure Environment Variables
Copy `.env.example` to `.env` (or set via AI Studio Secrets):
```env
GEMINI_API_KEY="your_api_key_here"
GEMINI_MODEL="gemini-3.8-flash"
```

### 2. Development Server
Start the development server (Express + Vite on port 3000):
```bash
npm run dev
```

### 3. Production Build
Build client assets and bundle the backend server:
```bash
npm run build
npm start
```
