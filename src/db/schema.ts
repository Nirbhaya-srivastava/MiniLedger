import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  phone: text('phone'),
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const loans = pgTable('loans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  friendName: text('friend_name').notNull(),
  amount: doublePrecision('amount').notNull(),
  dueDate: text('due_date').notNull(), // Format: YYYY-MM-DD
  notes: text('notes'),
  receiptUrl: text('receipt_url'), // Bonus feature: receipt photo
  isRepaid: boolean('is_repaid').default(false).notNull(),
  repaidAt: timestamp('repaid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.uid],
  }),
}));
