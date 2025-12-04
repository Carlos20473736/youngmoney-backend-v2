import { Router } from 'express';
import { db, schema } from '../db';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /notifications/list
 * Listar notificações do usuário
 */
router.get('/list', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const limit = parseInt(req.query.limit as string) || 20;
    
    const notifications = await db.select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
    
    res.json({
      status: 'success',
      data: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.isRead,
        created_at: n.createdAt
      }))
    });
    
  } catch (error) {
    console.error('[NOTIFICATIONS] Erro ao listar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar notificações'
    });
  }
});

/**
 * POST /notifications/mark_read
 * Marcar notificação como lida
 */
router.post('/mark_read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { notification_id } = req.body;
    
    if (!notification_id) {
      return res.status(400).json({
        status: 'error',
        message: 'notification_id é obrigatório'
      });
    }
    
    await db.update(schema.notifications)
      .set({ isRead: 1 })
      .where(eq(schema.notifications.id, notification_id));
    
    res.json({
      status: 'success',
      message: 'Notificação marcada como lida'
    });
    
  } catch (error) {
    console.error('[NOTIFICATIONS] Erro ao marcar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao marcar notificação'
    });
  }
});

export default router;
