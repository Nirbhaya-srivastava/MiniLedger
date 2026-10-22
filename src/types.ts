export interface UserProfile {
  id?: number;
  uid: string;
  phone?: string | null;
  email?: string | null;
  displayName?: string | null;
  createdAt?: string;
}

export interface LoanEntry {
  id: number;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string | null;
  receiptUrl?: string | null;
  isRepaid: boolean;
  repaidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  daysDifference?: number;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  totalPending: number;
  overdueAmount: number;
  totalCount: number;
  repaidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface TestResultItem {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export interface TestRunReport {
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResultItem[];
}
