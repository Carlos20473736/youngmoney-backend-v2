import { Router } from 'express';
import { db, schema } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /ranking/list
 * Lista ranking de usuários por pontos diários
 */
router.get('/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    
    const ranking = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      daily_points: schema.users.dailyPoints,
      total_points: schema.users.points
    })
      .from(schema.users)
      .orderBy(desc(schema.users.dailyPoints))
      .limit(limit);
    
    res.json({
      status: 'success',
      data: ranking.map((user, index) => ({
        position: index + 1,
        user_id: user.id,
        username: user.username,
        daily_points: user.daily_points,
        total_points: user.total_points
      }))
    });
    
  } catch (error) {
    console.error('[RANKING] Erro ao listar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar ranking'
    });
  }
});

/**
 * GET /ranking/user_position
 * Posição do usuário no ranking
 */
router.get('/user_position', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    // Buscar usuário
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Contar quantos usuários têm mais pontos diários
    const higherUsers = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.users)
      .where(sql`${schema.users.dailyPoints} > ${user.dailyPoints}`);
    
    const position = Number(higherUsers[0]?.count || 0) + 1;
    
    res.json({
      status: 'success',
      data: {
        position,
        daily_points: user.dailyPoints,
        total_points: user.points,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('[RANKING] Erro ao buscar posição:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar posição'
    });
  }
});

/**
 * POST /ranking/add_points
 * Adicionar pontos ao usuário (admin)
 */
router.post('/add_points', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { user_id, points, description } = req.body;
    
    if (!user_id || !points) {
      return res.status(400).json({
        status: 'error',
        message: 'user_id e points são obrigatórios'
      });
    }
    
    await db.transaction(async (tx) => {
      // Adicionar pontos
      await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} + ${points}`,
          dailyPoints: sql`${schema.users.dailyPoints} + ${points}`
        })
        .where(eq(schema.users.id, user_id));
      
      // Registrar no histórico
      await tx.insert(schema.pointsHistory).values({
        userId: user_id,
        points,
        description: description || 'Pontos adicionados pelo admin'
      });
    });
    
    res.json({
      status: 'success',
      message: 'Pontos adicionados com sucesso'
    });
    
  } catch (error) {
    console.error('[RANKING] Erro ao adicionar pontos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao adicionar pontos'
    });
  }
});

export default router;
