import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserInput {
  uid: string;
  phone?: string | null;
  email?: string | null;
  displayName?: string | null;
}

export async function getOrCreateUser(userData: UserInput) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: userData.uid,
        phone: userData.phone || null,
        email: userData.email || null,
        displayName: userData.displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          phone: userData.phone || null,
          email: userData.email || null,
          displayName: userData.displayName || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser query failed:', error);
    throw new Error('Database operation failed. Unable to register or update user profile.', {
      cause: error,
    });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const records = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return records[0] || null;
  } catch (error) {
    console.error('Database getUserByUid failed:', error);
    throw new Error('Database query failed. Unable to fetch user profile.', { cause: error });
  }
}
