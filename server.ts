import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { processBankStatement } from './server/geminiOcr';
import { SAMPLE_STATEMENTS } from './server/sampleData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increased body limit to support base64 encoded bank statement documents (PDFs & high-res images)
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get('/api/config', (req, res) => {
    res.json({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.get('/api/sample-statements', (req, res) => {
    res.json({
      samples: SAMPLE_STATEMENTS.map(s => ({
        id: s.id,
        name: s.name,
        bank: s.bank,
        description: s.description,
        fileName: s.fileName,
      })),
    });
  });

  app.get('/api/sample-statements/:id', (req, res) => {
    const sample = SAMPLE_STATEMENTS.find(s => s.id === req.params.id);
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    res.json({
      success: true,
      transactions: sample.transactions,
      metadata: sample.metadata,
      validationIssues: [],
    });
  });

  app.post('/api/extract-statement', async (req, res) => {
    try {
      const { fileData, mimeType, fileName } = req.body;

      if (!fileData || !mimeType) {
        return res.status(400).json({
          error: 'Missing file content or MIME type. Please select a valid document.',
        });
      }

      // Validate allowed file types
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];

      if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
        return res.status(400).json({
          error: 'Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.',
        });
      }

      // Check estimated base64 size (max ~25MB decoded)
      const approxSizeBytes = (fileData.length * 3) / 4;
      if (approxSizeBytes > 25 * 1024 * 1024) {
        return res.status(400).json({
          error: 'File size exceeds 25MB limit. Please upload a smaller file or split multi-month statements.',
        });
      }

      // Clean base64 string if it contains data URL prefix
      let cleanBase64 = fileData;
      if (fileData.includes(',')) {
        cleanBase64 = fileData.split(',')[1];
      }

      const result = await processBankStatement(
        cleanBase64,
        mimeType,
        fileName || 'statement.pdf'
      );

      if (!result.transactions || result.transactions.length === 0) {
        return res.json({
          success: true,
          transactions: [],
          metadata: result.metadata,
          validationIssues: ['No transactions were detected in this document.'],
        });
      }

      res.json({
        success: true,
        transactions: result.transactions,
        metadata: result.metadata,
        validationIssues: result.validationIssues,
      });
    } catch (err: any) {
      console.error('OCR Extraction Error:', err?.message || err);
      let rawMessage = err?.message || '';

      // Unwrap JSON if Gemini returned a stringified JSON error
      try {
        const parsed = JSON.parse(rawMessage);
        if (parsed?.error?.message) {
          rawMessage = parsed.error.message;
        }
      } catch {
        // not json string
      }

      if (rawMessage.includes('API_KEY')) {
        return res.status(500).json({
          error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in your AI Studio secrets.',
          isRetryable: false,
        });
      }

      if (
        rawMessage.includes('503') ||
        rawMessage.includes('high demand') ||
        rawMessage.includes('UNAVAILABLE') ||
        rawMessage.includes('overloaded')
      ) {
        return res.status(503).json({
          error:
            'The AI model is momentarily experiencing high demand. Automatic retries across alternative models were attempted. Please click "Retry Extraction" below.',
          isRetryable: true,
        });
      }

      if (rawMessage.includes('unreadable') || rawMessage.includes('JSON')) {
        return res.status(422).json({
          error: "We couldn't reliably read this statement table. Please upload a clearer image or PDF with visible text/tables.",
          isRetryable: false,
        });
      }

      res.status(500).json({
        error: rawMessage || 'An error occurred while processing the bank statement. Please try again.',
        isRetryable: true,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
});
