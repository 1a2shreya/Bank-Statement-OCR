export type TransactionCategory =
  | 'Income'
  | 'Food'
  | 'Shopping'
  | 'Transportation'
  | 'Bills & Utilities'
  | 'Rent'
  | 'Healthcare'
  | 'Education'
  | 'Entertainment'
  | 'Travel'
  | 'EMI/Loan'
  | 'Bank Charges'
  | 'ATM/Cash Withdrawal'
  | 'Transfer'
  | 'Investment'
  | 'Insurance'
  | 'UPI'
  | 'Other';

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Income',
  'Food',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Rent',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'EMI/Loan',
  'Bank Charges',
  'ATM/Cash Withdrawal',
  'Transfer',
  'Investment',
  'Insurance',
  'UPI',
  'Other',
];

export interface TransactionRow {
  id: string;
  date: string; // DD/MM/YYYY
  description: string;
  amount: number; // positive = credit/income, negative = debit/expense
  category: TransactionCategory;
  notes: string;
  needsReview?: boolean;
  reviewReason?: string;
  originalRawText?: string;
}

export interface StatementMetadata {
  detectedBank?: string;
  accountHolderMasked?: string;
  accountNumberMasked?: string;
  statementPeriod?: string;
  currency?: string;
  pageCount?: number;
  totalTransactionsFound?: number;
}

export interface ExtractionResponse {
  success: boolean;
  transactions: TransactionRow[];
  metadata: StatementMetadata;
  validationIssues?: string[];
  rawTextPreview?: string;
  error?: string;
}

export type ProcessingStatus =
  | 'idle'
  | 'uploading'
  | 'reading'
  | 'ocr'
  | 'detecting'
  | 'categorizing'
  | 'validating'
  | 'done'
  | 'error';

export interface ProcessingStepInfo {
  status: ProcessingStatus;
  label: string;
  detail: string;
  progress: number;
}
