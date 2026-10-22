import { Platform } from 'react-native';
import { LoanEntry, LoanSummary, TestRunReport, UserProfile } from '../types.ts';

// In-memory token storage for React Native mobile runtime
let memoryToken = '';
let memoryUid = '';
let memoryPhone = '';

export function setStoredAuth(token: string, uid: string, phone?: string) {
  memoryToken = token;
  memoryUid = uid;
  memoryPhone = phone || '';
}

export function clearStoredAuth() {
  memoryToken = '';
  memoryUid = '';
  memoryPhone = '';
}

export function getStoredAuth() {
  return { token: memoryToken, uid: memoryUid, phone: memoryPhone };
}

/**
 * Resolves the backend API URL.
 * Defaults to the live cloud URL so Android & iOS devices can communicate immediately.
 * On local dev, Android emulator uses 10.0.2.2:3000, iOS uses localhost:3000.
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  // Live Cloud Run URL for immediate mobile access
  const cloudUrl = 'https://ais-dev-sglvqiocjrfx26qsac67th-999373908360.asia-southeast1.run.app';
  if (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost')) {
    return window.location.origin;
  }

  // Local development fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return cloudUrl;
};

export async function getAuthHeader(): Promise<Record<string, string>> {
  if (memoryToken) {
    return { Authorization: `Bearer ${memoryToken}` };
  }
  return {};
}

export async function requestOtp(phone: string): Promise<{
  success: boolean;
  devOtpHint?: string;
  message: string;
  phone: string;
}> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to send OTP code.');
  }
  return data;
}

export async function verifyOtp(phone: string, otp: string): Promise<{
  success: boolean;
  uid: string;
  phone: string;
  customToken?: string;
  sessionToken?: string;
  user?: UserProfile;
}> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid OTP code.');
  }

  const token = data.sessionToken || data.customToken || '';
  setStoredAuth(token, data.uid, data.phone);

  return data;
}

export async function fetchSummary(): Promise<LoanSummary> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeader();
  const res = await fetch(`${baseUrl}/api/loans/summary`, {
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch loan summary.');
  }
  return data;
}

export async function fetchLoans(options?: {
  filter?: 'all' | 'pending' | 'repaid' | 'overdue';
  search?: string;
}): Promise<LoanEntry[]> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeader();
  const params = new URLSearchParams();
  if (options?.filter && options.filter !== 'all') params.set('filter', options.filter);
  if (options?.search) params.set('search', options.search);

  const res = await fetch(`${baseUrl}/api/loans?${params.toString()}`, {
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch loans.');
  }
  return data.loans || [];
}

export async function createLoanApi(loanData: {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  receiptUrl?: string;
}): Promise<LoanEntry> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeader();
  const res = await fetch(`${baseUrl}/api/loans`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loanData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create loan.');
  }
  return data.loan;
}

export async function toggleLoanRepayment(loanId: number, isRepaid: boolean): Promise<LoanEntry> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeader();
  const res = await fetch(`${baseUrl}/api/loans/${loanId}/repay`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isRepaid }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update repayment status.');
  }
  return data.loan;
}

export async function deleteLoanApi(loanId: number): Promise<boolean> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeader();
  const res = await fetch(`${baseUrl}/api/loans/${loanId}`, {
    method: 'DELETE',
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete loan.');
  }
  return data.success;
}

export async function runServerTests(): Promise<TestRunReport> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/tests/run`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to run test suite.');
  }
  return data;
}
