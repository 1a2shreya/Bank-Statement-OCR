import { GoogleGenAI, Type } from '@google/genai';
import { TransactionRow, StatementMetadata } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface OcrProcessingResult {
  transactions: TransactionRow[];
  metadata: StatementMetadata;
  validationIssues: string[];
}

const VALID_CATEGORIES = [
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

export async function processBankStatement(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<OcrProcessingResult> {
  const ai = getGenAIClient();
  const configuredModel = process.env.GEMINI_MODEL;

  const systemInstruction = `You are a professional, high-precision Bank Statement OCR and Transaction Extraction specialist.
Your task is to analyze bank statements (in PDF or image formats) and extract EVERY individual transaction into a structured table.

CRITICAL EXTRACTION RULES:
1. TARGET COLUMNS:
   - Date: Strictly format as DD/MM/YYYY. If year is omitted on a row but clear from statement period/header, infer it. Never fabricate dates.
   - Description: Extract complete transaction description / narration. Preserve important transaction identifiers such as UPI reference numbers, NEFT reference numbers, IMPS reference numbers, ATM codes, card transaction codes, and merchant names. Clean OCR artifacts and line-break gibberish.
   - Amount: Numeric amount.
     * DEBIT / WITHDRAWAL / EXPENSE / CHARGE / EMI: MUST BE A NEGATIVE NUMBER (e.g. -450.00, -1299.50).
     * CREDIT / DEPOSIT / INCOME / SALARY / REFUND / INTEREST: MUST BE A POSITIVE NUMBER (e.g. 45000.00, 120.00).
     * DO NOT confuse the running "Balance" column with the transaction Amount.
     * Remove currency symbols (₹, $, €, £, Rs, etc.) and commas from the number.
   - Category: Classify accurately into one of:
     Income, Food, Shopping, Transportation, Bills & Utilities, Rent, Healthcare, Education, Entertainment, Travel, EMI/Loan, Bank Charges, ATM/Cash Withdrawal, Transfer, Investment, Insurance, UPI, Other.
     * Note: Do NOT classify all UPI transactions as "UPI". UPI is a payment method.
       E.g., "UPI-ZOMATO" -> Food, "UPI-AMAZON" -> Shopping, "UPI-UBER" -> Transportation, "UPI-AIRTEL" -> Bills & Utilities, "UPI-RENT" -> Rent.
       Only use "UPI" if the recipient and purpose are completely generic/unknown person-to-person transfer.
   - Notes: Short helpful note describing the transaction (e.g., "Online food order", "Monthly salary credit", "ATM cash withdrawal", "Electricity bill payment", "Bank monthly charge"). If no useful note, leave as empty string "". Do not hallucinate!
   - needsReview: boolean. Set to true if date was hard to decipher, amount was ambiguous, row was split across lines, or multiple columns collided.
   - reviewReason: Short explanation if needsReview is true, otherwise empty string "".

2. NON-TRANSACTION DATA FILTERING:
   - DO NOT extract bank headers, customer names, branch addresses, IFSC codes, PAN numbers, account numbers, opening balance, closing balance, summary cards, or footer disclaimers as transactions!
   - Extract bank name and masked account information into metadata for user reference.
   - Mask any sensitive personal data (e.g. account numbers like "XXXX-XXXX-1234", name as "A**** K****").

3. MULTI-PAGE STATEMENTS:
   - Process all pages sequentially.
   - Maintain transaction order.
   - Combine all pages into a single chronological or statement-order list.
   - Do NOT duplicate rows appearing across page boundaries or repeating column headers.`;

  const prompt = `Analyze this uploaded bank statement document (${fileName}) thoroughly.
Extract all individual financial transactions from the statement table following the instructions.
Return structured JSON containing statement metadata and the full array of extracted transactions.`;

  const documentPart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Data,
    },
  };

  const generationConfig = {
    systemInstruction,
    temperature: 0.1, // low temperature for high extraction fidelity
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        detectedBank: {
          type: Type.STRING,
          description: 'Detected bank or institution name (e.g. HDFC Bank, SBI, ICICI, etc.)',
        },
        accountHolderMasked: {
          type: Type.STRING,
          description: 'Masked account holder name (e.g. J*** D**)',
        },
        accountNumberMasked: {
          type: Type.STRING,
          description: 'Masked account number (e.g. ending in XXXX-1234)',
        },
        statementPeriod: {
          type: Type.STRING,
          description: 'Statement period (e.g. 01/09/2026 to 30/09/2026)',
        },
        currency: {
          type: Type.STRING,
          description: 'Currency code or symbol (e.g. INR, USD)',
        },
        transactions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: {
                type: Type.STRING,
                description: 'Transaction date in DD/MM/YYYY format',
              },
              description: {
                type: Type.STRING,
                description: 'Cleaned transaction description / narration with references',
              },
              amount: {
                type: Type.NUMBER,
                description: 'Signed transaction amount: negative for debits/expenses, positive for credits/income',
              },
              category: {
                type: Type.STRING,
                description: 'Category chosen from the standardized list',
              },
              notes: {
                type: Type.STRING,
                description: 'Brief contextual note or empty string',
              },
              needsReview: {
                type: Type.BOOLEAN,
                description: 'Flag if the extraction needs user manual review',
              },
              reviewReason: {
                type: Type.STRING,
                description: 'Reason for review flag if any',
              },
            },
            required: ['date', 'description', 'amount', 'category', 'notes', 'needsReview'],
          },
        },
      },
      required: ['transactions'],
    },
  };

  // Prioritize high-availability model (gemini-3.1-flash-lite) to avoid 503 high demand spikes
  const candidateModels = Array.from(
    new Set([
      configuredModel && configuredModel !== 'gemini-3.8-flash' ? configuredModel : null,
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ].filter(Boolean) as string[])
  );

  let responseText = '';
  let lastError: any = null;

  for (const model of candidateModels) {
    // Retry each candidate model up to 2 times with backoff on 503 / 429
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini OCR] Executing model: ${model} (attempt ${attempt}/${2})...`);
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [documentPart, { text: prompt }],
          },
          config: generationConfig,
        });

        if (response.text) {
          responseText = response.text;
          console.log(`[Gemini OCR] Success using model ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransientDemandSpike =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini OCR] Model ${model} (attempt ${attempt}) returned: ${msg.slice(0, 160)}`);

        if (isTransientDemandSpike && attempt < 2) {
          // Exponential jittered wait
          const waitMs = attempt * 1200 + Math.random() * 400;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          // Switch to the next model in candidateModels
          break;
        }
      }
    }

    if (responseText) {
      break;
    }
  }

  if (!responseText) {
    let cleanMessage = lastError?.message || 'AI service temporarily unavailable';
    try {
      const parsedError = JSON.parse(cleanMessage);
      if (parsedError?.error?.message) {
        cleanMessage = parsedError.error.message;
      }
    } catch {
      // not json
    }

    if (
      cleanMessage.includes('503') ||
      cleanMessage.includes('high demand') ||
      cleanMessage.includes('UNAVAILABLE')
    ) {
      throw new Error(
        'The AI service is experiencing a temporary spike in demand across available models. Please click "Retry" in a few seconds.'
      );
    }
    throw new Error(cleanMessage);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse Gemini OCR JSON response:', responseText);
    throw new Error('Failed to parse document extraction response. Please ensure document is clear and readable.');
  }

  const rawTransactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  const validationIssues: string[] = [];

  // Post-processing & normalization pass
  const cleanTransactions: TransactionRow[] = rawTransactions
    .map((item: any, index: number) => {
      let date = String(item.date || '').trim();
      let description = String(item.description || '').trim();
      let amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount || '0').replace(/[^0-9.-]/g, ''));
      let category = String(item.category || 'Other').trim();
      let notes = String(item.notes || '').trim();
      let needsReview = Boolean(item.needsReview);
      let reviewReason = String(item.reviewReason || '').trim();

      // Normalize date format if in YYYY-MM-DD or MM/DD/YYYY or DD-MM-YYYY
      const dateDashMatch = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (dateDashMatch) {
        date = `${dateDashMatch[1]}/${dateDashMatch[2]}/${dateDashMatch[3]}`;
      }
      const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        date = `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }

      // Validate date
      const validDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!validDateRegex.test(date)) {
        needsReview = true;
        reviewReason = reviewReason || 'Date format needs verification';
        validationIssues.push(`Row ${index + 1}: Unrecognized date format "${date}"`);
      }

      // Validate amount
      if (isNaN(amount) || amount === 0) {
        needsReview = true;
        reviewReason = reviewReason || 'Zero or unparsed amount';
        amount = 0;
      }

      // Check category validity
      if (!VALID_CATEGORIES.includes(category)) {
        category = 'Other';
      }

      // Filter accidental header rows or totals
      const descLower = description.toLowerCase();
      if (
        descLower.includes('carried forward') ||
        descLower.includes('brought forward') ||
        descLower.startsWith('total ') ||
        descLower === 'opening balance' ||
        descLower === 'closing balance' ||
        descLower.includes('date | narration') ||
        descLower.includes('chq/ref no')
      ) {
        return null;
      }

      return {
        id: `tx-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        date,
        description,
        amount: Math.round(amount * 100) / 100, // round to 2 decimal places
        category: category as any,
        notes,
        needsReview,
        reviewReason: reviewReason || (needsReview ? 'Please verify extraction accuracy' : undefined),
      };
    })
    .filter((tx: TransactionRow | null): tx is TransactionRow => tx !== null);

  const metadata: StatementMetadata = {
    detectedBank: parsed.detectedBank || 'Bank Statement',
    accountHolderMasked: parsed.accountHolderMasked || 'Account Holder',
    accountNumberMasked: parsed.accountNumberMasked || 'Account',
    statementPeriod: parsed.statementPeriod || 'Recent Period',
    currency: parsed.currency || 'INR',
    totalTransactionsFound: cleanTransactions.length,
  };

  return {
    transactions: cleanTransactions,
    metadata,
    validationIssues,
  };
}
