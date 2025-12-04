import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export interface JWTPayload {
  userId: string;
  email?: string;
  deviceId?: string;
}

/**
 * Gera token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
