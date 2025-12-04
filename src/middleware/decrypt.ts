import { Request, Response, NextFunction } from 'express';
import { decrypt } from '../utils/crypto';

/**
 * Middleware para descriptografar body criptografado pelo app Android
 */
export function decryptMiddleware(req: Request, res: Response, next: NextFunction) {
  // Verificar se o body está criptografado
  if (req.body && req.body.encrypted && req.body.data) {
    try {
      const decryptedData = decrypt(req.body.data);
      
      if (!decryptedData) {
        return res.status(400).json({ 
          success: false, 
          message: 'Erro ao descriptografar dados' 
        });
      }
      
      // Substituir body pelo dado descriptografado
      req.body = JSON.parse(decryptedData);
      console.log('[DECRYPT] Body descriptografado com sucesso');
    } catch (error) {
      console.error('[DECRYPT] Erro:', error);
      return res.status(400).json({ 
        success: false, 
        message: 'Dados criptografados inválidos' 
      });
    }
  }
  
  next();
}
