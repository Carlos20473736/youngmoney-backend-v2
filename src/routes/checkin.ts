import { Router } from 'express';
import { db, schema } from '../db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/checkin
 * Fazer check-in diário
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    // Verificar se já fez check-in hoje
    const today = new Date().toISOString().split('T')[0];
    
    const todayCheckin = await db.select()
      .from(schema.pointsHistory)
      .where(and(
        eq(schema.pointsHistory.userId, userId),
        sql`DATE(${schema.pointsHistory.createdAt}) = ${today}`,
        sql`${schema.pointsHistory.description} LIKE '%Check-in diário%'`
      ))
      .limit(1);
    
    if (todayCheckin.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Você já fez check-in hoje!'
      });
    }
    
    // Buscar recompensa de check-in
    const rewardSetting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.settingKey, 'checkin_reward')
    });
    
    const reward = parseInt(rewardSetting?.settingValue || '100');
    
    // Transação: adicionar pontos + registrar check-in
    await db.transaction(async (tx) => {
      // Adicionar pontos
      await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} + ${reward}`,
          dailyPoints: sql`${schema.users.dailyPoints} + ${reward}`
        })
        .where(eq(schema.users.id, userId));
      
      // Registrar no histórico
      await tx.insert(schema.pointsHistory).values({
        userId,
        points: reward,
        description: 'Check-in diário'
      });
    });
    
    // Buscar saldo atualizado
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    res.json({
      status: 'success',
      message: `Check-in realizado! Você ganhou ${reward} pontos!`,
      data: {
        reward,
        new_balance: user?.points || 0
      }
    });
    
  } catch (error) {
    console.error('[CHECKIN] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao fazer check-in'
    });
  }
});

/**
 * GET /history/points
 * Histórico de pontos
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await db.select()
      .from(schema.pointsHistory)
      .where(eq(schema.pointsHistory.userId, userId))
      .orderBy(desc(schema.pointsHistory.createdAt))
      .limit(limit);
    
    res.json({
      status: 'success',
      data: history.map(h => ({
        id: h.id,
        points: h.points,
        description: h.description,
        created_at: h.createdAt
      }))
    });
    
  } catch (error) {
    console.error('[POINTS] Erro ao buscar histórico:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar histórico'
    });
  }
});

export default router;
