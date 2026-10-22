import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; phone?: string; email?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch (firebaseErr: any) {
    // If client is using development phone mock session token
    if (token.startsWith('dev_session_')) {
      try {
        const payloadStr = Buffer.from(token.replace('dev_session_', ''), 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        req.user = { uid: payload.uid, phone: payload.phone };
        return next();
      } catch (e) {
        console.error('Error decoding dev session token:', e);
      }
    }

    console.error('Firebase token verification error:', firebaseErr?.message || firebaseErr);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
  }
};
