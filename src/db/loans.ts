import { db } from './index.ts';
import { loans } from './schema.ts';
import { and, desc, eq, sql } from 'drizzle-orm';

export interface CreateLoanInput {
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string;
  receiptUrl?: string;
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

export async function createLoan(userId: string, input: CreateLoanInput) {
  try {
    const result = await db
      .insert(loans)
      .values({
        userId,
        friendName: input.friendName.trim(),
        amount: Number(input.amount),
        dueDate: input.dueDate.trim(),
        notes: input.notes?.trim() || null,
        receiptUrl: input.receiptUrl || null,
        isRepaid: false,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database createLoan query failed:', error);
    throw new Error('Database query failed. Unable to create loan entry.', { cause: error });
  }
}

export async function markLoanRepaid(userId: string, loanId: number, isRepaid: boolean = true) {
  try {
    const result = await db
      .update(loans)
      .set({
        isRepaid,
        repaidAt: isRepaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
      .returning();

    if (!result.length) {
      return null;
    }
    return result[0];
  } catch (error) {
    console.error('Database markLoanRepaid query failed:', error);
    throw new Error('Database query failed. Unable to update loan repayment status.', {
      cause: error,
    });
  }
}

export async function getLoansByUser(
  userId: string,
  options?: {
    filter?: 'all' | 'pending' | 'repaid' | 'overdue';
    search?: string;
  }
) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const results = await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));

    let filtered = results;

    if (options?.filter === 'pending') {
      filtered = filtered.filter((l) => !l.isRepaid);
    } else if (options?.filter === 'repaid') {
      filtered = filtered.filter((l) => l.isRepaid);
    } else if (options?.filter === 'overdue') {
      filtered = filtered.filter((l) => !l.isRepaid && l.dueDate < today);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.friendName.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    return filtered;
  } catch (error) {
    console.error('Database getLoansByUser query failed:', error);
    throw new Error('Database query failed. Unable to fetch loan entries.', { cause: error });
  }
}

export async function getLoanSummary(userId: string): Promise<LoanSummary> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const userLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId));

    let totalLent = 0;
    let totalRepaid = 0;
    let totalPending = 0;
    let overdueAmount = 0;
    let repaidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    for (const loan of userLoans) {
      const amt = Number(loan.amount) || 0;
      totalLent += amt;
      if (loan.isRepaid) {
        totalRepaid += amt;
        repaidCount++;
      } else {
        totalPending += amt;
        pendingCount++;
        if (loan.dueDate < today) {
          overdueAmount += amt;
          overdueCount++;
        }
      }
    }

    return {
      totalLent: Math.round(totalLent * 100) / 100,
      totalRepaid: Math.round(totalRepaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      totalCount: userLoans.length,
      repaidCount,
      pendingCount,
      overdueCount,
    };
  } catch (error) {
    console.error('Database getLoanSummary query failed:', error);
    throw new Error('Database query failed. Unable to calculate loan summary.', { cause: error });
  }
}

export async function deleteLoan(userId: string, loanId: number) {
  try {
    const result = await db
      .delete(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Database deleteLoan query failed:', error);
    throw new Error('Database query failed. Unable to delete loan entry.', { cause: error });
  }
}
