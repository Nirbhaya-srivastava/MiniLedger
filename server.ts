import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  createLoan,
  getLoansByUser,
  getLoanSummary,
  markLoanRepaid,
  deleteLoan,
} from './src/db/loans.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
// Allow up to 15mb for receipt photo uploads (base64)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory OTP storage for mock phone login
interface OtpEntry {
  otp: string;
  phone: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry>();

// Clean expired OTPs every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 120000);

// Helper to normalize phone number
function normalizePhone(input: string): string {
  const cleaned = input.trim().replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+1${cleaned.replace(/^1/, '')}`;
  }
  return cleaned;
}

// -------------------------------------------------------------
// Authentication APIs
// -------------------------------------------------------------

/**
 * Send OTP: Generates a 6-digit mock OTP, prints it to server logs, and saves it
 */
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 6) {
      return res.status(400).json({ error: 'Please enter a valid phone number (at least 6 digits).' });
    }

    const normalized = normalizePhone(phone);
    // Generate secure 6-digit mock OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore.set(normalized, { otp, phone: normalized, expiresAt });

    // Print OTP in the server logs with high-visibility formatting
    console.log('\n=============================================================');
    console.log('       📱 MiniLedger MOCK OTP DISPATCH SERVICE');
    console.log('=============================================================');
    console.log(` Target Phone Number : ${normalized}`);
    console.log(` Generated Mock OTP  : >>> ${otp} <<<`);
    console.log(` Validity            : 5 minutes (Expires at ${new Date(expiresAt).toLocaleTimeString()})`);
    console.log('=============================================================\n');

    return res.json({
      success: true,
      message: 'OTP has been generated and dispatched to server logs.',
      phone: normalized,
      // Provide devOtp hint so frontend can display a convenient "Fill from Logs" badge
      devOtpHint: otp,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('Error generating OTP:', error);
    return res.status(500).json({ error: 'Failed to generate OTP. Please try again.' });
  }
});

/**
 * Verify OTP: Verifies user-entered OTP and returns Firebase Custom Token / Session Token
 */
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Both phone number and OTP code are required.' });
    }

    const normalized = normalizePhone(phone);
    const stored = otpStore.get(normalized);

    // Allow master test code 888888 or matching OTP
    const isValidOtp = (stored && stored.otp === otp.trim() && stored.expiresAt > Date.now()) || otp.trim() === '888888';

    if (!isValidOtp) {
      if (stored && stored.expiresAt <= Date.now()) {
        otpStore.delete(normalized);
        return res.status(400).json({ error: 'The OTP code has expired. Please request a new one.' });
      }
      return res.status(400).json({ error: 'Invalid OTP code. Please check server logs and try again.' });
    }

    // OTP verified: remove one-time token
    otpStore.delete(normalized);

    const uid = `phone_${normalized.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Create or retrieve in Firebase Auth
    let customToken = '';
    try {
      try {
        await adminAuth.getUser(uid);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          await adminAuth.createUser({
            uid,
            displayName: `Friend (${normalized})`,
          });
        }
      }
      customToken = await adminAuth.createCustomToken(uid, { phone: normalized });
    } catch (firebaseErr: any) {
      console.warn('Firebase custom token generation notice:', firebaseErr?.message);
    }

    // Upsert into PostgreSQL users table
    const dbUser = await getOrCreateUser({
      uid,
      phone: normalized,
      displayName: `User (${normalized})`,
    });

    const sessionToken = `dev_session_${Buffer.from(JSON.stringify({ uid, phone: normalized })).toString('base64')}`;

    return res.json({
      success: true,
      uid,
      phone: normalized,
      customToken,
      sessionToken,
      user: dbUser,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: error.message || 'OTP verification failed.' });
  }
});

/**
 * User Profile Sync (for Google or Firebase OAuth logins)
 */
app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const uid = user.uid;
    const email = 'email' in user ? user.email : undefined;
    const phone = 'phone' in user ? user.phone : undefined;
    const name = 'name' in user ? (user as any).name : undefined;

    const dbUser = await getOrCreateUser({
      uid,
      email: email || null,
      phone: phone || null,
      displayName: name || (phone ? `Friend (${phone})` : 'MiniLedger User'),
    });

    return res.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    return res.status(500).json({ error: 'Failed to synchronize user account.' });
  }
});

// -------------------------------------------------------------
// Loan Management APIs
// -------------------------------------------------------------

/**
 * Add a loan entry with friend name, amount, due date, notes, receipt photo
 */
app.post('/api/loans', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { friendName, amount, dueDate, notes, receiptUrl } = req.body;

    // Strict input validation
    if (!friendName || typeof friendName !== 'string' || !friendName.trim()) {
      return res.status(400).json({ error: 'Friend name is required and cannot be empty.' });
    }
    if (friendName.trim().length > 80) {
      return res.status(400).json({ error: 'Friend name cannot exceed 80 characters.' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Loan amount must be a positive number greater than 0.' });
    }
    if (numericAmount > 10000000) {
      return res.status(400).json({ error: 'Loan amount exceeds maximum allowable limit.' });
    }

    if (!dueDate || typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      return res.status(400).json({ error: 'Valid due date in YYYY-MM-DD format is required.' });
    }

    const newLoan = await createLoan(userId, {
      friendName: friendName.trim(),
      amount: numericAmount,
      dueDate: dueDate.trim(),
      notes: notes ? String(notes).trim() : undefined,
      receiptUrl: receiptUrl ? String(receiptUrl) : undefined,
    });

    console.log(`[MiniLedger API] Created loan ID ${newLoan.id} for user ${userId}: $${numericAmount} to ${friendName}`);

    return res.status(201).json({
      success: true,
      loan: newLoan,
      message: 'Loan entry recorded successfully.',
    });
  } catch (error: any) {
    console.error('Failed to create loan entry:', error);
    return res.status(500).json({ error: error.message || 'Unable to record loan entry in database.' });
  }
});

/**
 * List loans with optional filter ('all' | 'pending' | 'repaid' | 'overdue') and search
 */
app.get('/api/loans', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const filter = req.query.filter as 'all' | 'pending' | 'repaid' | 'overdue' | undefined;
    const search = req.query.search as string | undefined;

    const list = await getLoansByUser(userId, { filter, search });
    const today = new Date().toISOString().split('T')[0];

    // Annotate with isOverdue
    const enriched = list.map((loan) => ({
      ...loan,
      isOverdue: !loan.isRepaid && loan.dueDate < today,
      daysDifference: Math.ceil(
        (new Date(loan.dueDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24)
      ),
    }));

    return res.json({ loans: enriched });
  } catch (error: any) {
    console.error('Failed to fetch loans:', error);
    return res.status(500).json({ error: error.message || 'Unable to fetch loans.' });
  }
});

/**
 * Mark a loan entry as repaid (or toggle back to unrepaid)
 */
app.patch('/api/loans/:id/repay', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const loanId = parseInt(req.params.id, 10);
    if (isNaN(loanId)) {
      return res.status(400).json({ error: 'Invalid loan ID parameter.' });
    }

    const isRepaid = req.body.isRepaid !== undefined ? Boolean(req.body.isRepaid) : true;
    const updated = await markLoanRepaid(userId, loanId, isRepaid);

    if (!updated) {
      return res.status(404).json({ error: 'Loan entry not found or unauthorized.' });
    }

    console.log(`[MiniLedger API] Marked loan ID ${loanId} as repaid=${isRepaid} for user ${userId}`);

    return res.json({
      success: true,
      loan: updated,
      message: isRepaid ? 'Loan marked as repaid!' : 'Loan marked as pending.',
    });
  } catch (error: any) {
    console.error('Failed to update repayment status:', error);
    return res.status(500).json({ error: error.message || 'Unable to update loan repayment status.' });
  }
});

/**
 * Summary endpoint: returns total lent, total repaid, and overdue amount
 */
app.get('/api/loans/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const summary = await getLoanSummary(userId);

    return res.json(summary);
  } catch (error: any) {
    console.error('Failed to calculate loan summary:', error);
    return res.status(500).json({ error: error.message || 'Unable to calculate loan summary.' });
  }
});

/**
 * Delete a loan entry
 */
app.delete('/api/loans/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const loanId = parseInt(req.params.id, 10);
    if (isNaN(loanId)) {
      return res.status(400).json({ error: 'Invalid loan ID parameter.' });
    }

    const deleted = await deleteLoan(userId, loanId);
    if (!deleted) {
      return res.status(404).json({ error: 'Loan entry not found or unauthorized.' });
    }

    return res.json({ success: true, message: 'Loan entry removed.' });
  } catch (error: any) {
    console.error('Failed to delete loan:', error);
    return res.status(500).json({ error: error.message || 'Unable to delete loan.' });
  }
});

// -------------------------------------------------------------
// Health & Automated Self-Tests Endpoint (Bonus Feature)
// -------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'MiniLedger API', time: new Date().toISOString() });
});

app.get('/api/tests/run', async (req: Request, res: Response) => {
  const results: { name: string; passed: boolean; message: string; durationMs: number }[] = [];
  const testPhone = '+15550199222';
  const testUid = `phone_${testPhone.replace(/[^a-zA-Z0-9]/g, '_')}`;

  async function test(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      results.push({ name, passed: true, message: 'Passed', durationMs: Math.round(performance.now() - start) });
    } catch (e: any) {
      results.push({ name, passed: false, message: e.message || String(e), durationMs: Math.round(performance.now() - start) });
    }
  }

  // Test 1: User upsert in PostgreSQL
  await test('PostgreSQL User Upsert', async () => {
    const u = await getOrCreateUser({ uid: testUid, phone: testPhone, displayName: 'Test User' });
    if (!u || u.uid !== testUid) throw new Error('Failed to create or update test user record');
  });

  // Test 2: Add loan entry with validation
  let testLoanId = 0;
  await test('Create Loan Entry API validation & DB insertion', async () => {
    const loan = await createLoan(testUid, {
      friendName: 'Alex Rivera (Test)',
      amount: 150.5,
      dueDate: '2025-01-01', // intentionally overdue date for summary testing
      notes: 'Dinner bill split',
    });
    if (!loan || loan.amount !== 150.5) throw new Error('Loan insertion returned invalid amount');
    testLoanId = loan.id;
  });

  // Test 3: Calculate loan summary metrics
  await test('Calculate Loan Summary Metrics', async () => {
    const summary = await getLoanSummary(testUid);
    if (summary.totalLent < 150.5) throw new Error('Total lent calculation mismatch');
    if (summary.overdueAmount < 150.5) throw new Error('Overdue calculation mismatch for past due date');
  });

  // Test 4: Mark loan as repaid
  await test('Mark Loan Repaid Status & Verification', async () => {
    const updated = await markLoanRepaid(testUid, testLoanId, true);
    if (!updated || !updated.isRepaid) throw new Error('Failed to mark loan as repaid');
    const summaryAfter = await getLoanSummary(testUid);
    if (summaryAfter.totalRepaid < 150.5) throw new Error('Total repaid should increase after marking repaid');
  });

  // Cleanup test loan
  if (testLoanId > 0) {
    await deleteLoan(testUid, testLoanId).catch(() => {});
  }

  const allPassed = results.every((r) => r.passed);
  res.json({
    success: allPassed,
    totalTests: results.length,
    passedTests: results.filter((r) => r.passed).length,
    results,
  });
});

// -------------------------------------------------------------
// Pure Node.js Express Backend Service
// -------------------------------------------------------------
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    app: 'MiniLedger API Server',
    status: 'online',
    version: '1.0.0',
    database: 'PostgreSQL (Cloud SQL)',
    endpoints: [
      'POST /api/auth/send-otp',
      'POST /api/auth/verify-otp',
      'GET /api/loans',
      'POST /api/loans',
      'PATCH /api/loans/:id/repay',
      'GET /api/loans/summary',
      'GET /api/tests/run',
      'GET /api/health',
    ],
  });
});

import { createServer as createViteServer } from 'vite';

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite middleware warning, serving dist fallback:', e);
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist/index.html'));
      });
    }
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MiniLedger Fullstack API & Mobile Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
