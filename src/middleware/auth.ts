import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Middleware para verificar autenticação JWT
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token não fornecido' });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado' });
  }
  
  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}

/**
 * Middleware opcional de autenticação (não retorna erro se não autenticado)
 */
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (payload) {
      req.userId = payload.userId;
      req.userEmail = payload.email;
    }
  }
  
  next();
}
