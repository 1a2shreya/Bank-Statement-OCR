import { TransactionRow, StatementMetadata } from '../src/types';

export interface SampleStatementPreset {
  id: string;
  name: string;
  bank: string;
  description: string;
  fileName: string;
  metadata: StatementMetadata;
  transactions: TransactionRow[];
}

export const SAMPLE_STATEMENTS: SampleStatementPreset[] = [
  {
    id: 'sample-hdfc',
    name: 'HDFC Bank - Monthly Activity Statement',
    bank: 'HDFC Bank Ltd.',
    description: 'Real-world statement containing UPI, Swiggy/Zomato, Amazon, Salary credit, and ATM withdrawal.',
    fileName: 'HDFC_Statement_Sep2026.pdf',
    metadata: {
      detectedBank: 'HDFC Bank Ltd.',
      accountHolderMasked: 'S**** A****',
      accountNumberMasked: 'XXXX-XXXX-8921',
      statementPeriod: '01/09/2026 to 30/09/2026',
      currency: 'INR',
      totalTransactionsFound: 8,
    },
    transactions: [
      {
        id: 'tx-sample-1',
        date: '02/09/2026',
        description: 'UPI-ZOMATO-ORDER/UPI/424598129034/Pay',
        amount: -450.0,
        category: 'Food',
        notes: 'Online food order via Zomato',
      },
      {
        id: 'tx-sample-2',
        date: '05/09/2026',
        description: 'AMAZON PAYMENTS INDIA PVT LTD / CC-TXN-984',
        amount: -1299.0,
        category: 'Shopping',
        notes: 'Online retail shopping purchase',
      },
      {
        id: 'tx-sample-3',
        date: '10/09/2026',
        description: 'UPI-UBER RIDES/BANGALORE/UPI/5920381023',
        amount: -340.5,
        category: 'Transportation',
        notes: 'Cab ride commute',
      },
      {
        id: 'tx-sample-4',
        date: '14/09/2026',
        description: 'ACH-TECHCORP SOLUTIONS/SALARY/SEP26',
        amount: 85000.0,
        category: 'Income',
        notes: 'Monthly corporate salary credit',
      },
      {
        id: 'tx-sample-5',
        date: '15/09/2026',
        description: 'ATM WDL - HDFC ATM INDIRANAGAR 560038',
        amount: -5000.0,
        category: 'ATM/Cash Withdrawal',
        notes: 'ATM cash withdrawal',
      },
      {
        id: 'tx-sample-6',
        date: '18/09/2026',
        description: 'UPI-TATA POWER ELECTRICITY/BILL/7723901',
        amount: -1820.0,
        category: 'Bills & Utilities',
        notes: 'Monthly electricity utility bill',
      },
      {
        id: 'tx-sample-7',
        date: '20/09/2026',
        description: 'NACH DEBIT - HDFC HOME LOAN EMI/LN78321',
        amount: -28450.0,
        category: 'EMI/Loan',
        notes: 'Monthly housing loan EMI payment',
      },
      {
        id: 'tx-sample-8',
        date: '30/09/2026',
        description: 'INT.PD:01-07-2026 TO 30-09-2026/QTR INT',
        amount: 642.5,
        category: 'Income',
        notes: 'Quarterly savings bank interest credit',
      },
    ],
  },
  {
    id: 'sample-sbi',
    name: 'State Bank of India - Savings Account',
    bank: 'State Bank of India',
    description: 'Statement with NEFT transfer, UPI grocery, hospital bill, and SMS charges.',
    fileName: 'SBI_Savings_Passbook_Sep2026.png',
    metadata: {
      detectedBank: 'State Bank of India',
      accountHolderMasked: 'R**** K****',
      accountNumberMasked: 'XXXX-XXXX-4510',
      statementPeriod: '01/09/2026 to 15/09/2026',
      currency: 'INR',
      totalTransactionsFound: 6,
    },
    transactions: [
      {
        id: 'tx-sbi-1',
        date: '01/09/2026',
        description: 'NEFT-AXISB0000123-HOUSE RENT SEP26-N1209381',
        amount: -18000.0,
        category: 'Rent',
        notes: 'Monthly apartment rent transfer',
      },
      {
        id: 'tx-sbi-2',
        date: '03/09/2026',
        description: 'UPI-BLINKIT/GROCERIES/UPI/3948102934',
        amount: -890.0,
        category: 'Food',
        notes: 'Quick grocery delivery',
      },
      {
        id: 'tx-sbi-3',
        date: '06/09/2026',
        description: 'POS APOLLO PHARMACY BANGALORE',
        amount: -640.0,
        category: 'Healthcare',
        notes: 'Pharmacy prescription purchase',
      },
      {
        id: 'tx-sbi-4',
        date: '08/09/2026',
        description: 'UPI-NETFLIX ENTERTAINMENT SUBSCRIPTION',
        amount: -649.0,
        category: 'Entertainment',
        notes: 'Streaming subscription payment',
      },
      {
        id: 'tx-sbi-5',
        date: '12/09/2026',
        description: 'IMPS/P2A/TRANSFER FROM PRIYA/GIFT',
        amount: 2500.0,
        category: 'Transfer',
        notes: 'Inward IMPS bank transfer',
      },
      {
        id: 'tx-sbi-6',
        date: '15/09/2026',
        description: 'QTRLY SMS ALERT CHARGES INCL GST',
        amount: -17.7,
        category: 'Bank Charges',
        notes: 'Bank SMS alert service charge',
      },
    ],
  },
];
