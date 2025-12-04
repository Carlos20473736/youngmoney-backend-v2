import { Router } from 'express';
import { db, schema } from '../db';
import { eq, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /invite/my_code
 * Obter código de convite do usuário
 */
router.get('/my_code', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Contar quantos usaram o código
    const invites = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId));
    
    const inviteCount = Number(invites[0]?.count || 0);
    
    res.json({
      status: 'success',
      data: {
        referral_code: user.referralCode,
        invite_count: inviteCount,
        total_earned: user.totalEarned
      }
    });
    
  } catch (error) {
    console.error('[INVITE] Erro ao buscar código:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar código de convite'
    });
  }
});

/**
 * POST /api/v1/invite/validate
 * Validar e usar código de convite
 */
router.post('/validate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { invite_code } = req.body;
    
    if (!invite_code) {
      return res.status(400).json({
        status: 'error',
        message: 'Código de convite é obrigatório'
      });
    }
    
    // Buscar usuário atual
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar se já usou um código
    if (user.hasUsedInviteCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Você já usou um código de convite'
      });
    }
    
    // Buscar dono do código
    const referrer = await db.query.users.findFirst({
      where: eq(schema.users.referralCode, invite_code)
    });
    
    if (!referrer) {
      return res.status(404).json({
        status: 'error',
        message: 'Código de convite inválido'
      });
    }
    
    // Não pode usar o próprio código
    if (referrer.id === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Você não pode usar seu próprio código'
      });
    }
    
    // Buscar recompensa nas configurações
    const rewardSetting = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.settingKey, 'invite_reward')
    });
    
    const reward = parseInt(rewardSetting?.settingValue || '1000');
    
    // Transação: marcar como usado + dar recompensa + criar referral
    await db.transaction(async (tx) => {
      // 1. Marcar usuário como tendo usado código
      await tx.update(schema.users)
        .set({
          hasUsedInviteCode: 1,
          referredBy: invite_code
        })
        .where(eq(schema.users.id, userId));
      
      // 2. Dar recompensa ao referrer
      await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} + ${reward}`,
          totalEarned: sql`${schema.users.totalEarned} + ${reward}`
        })
        .where(eq(schema.users.id, referrer.id));
      
      // 3. Criar registro de referral
      await tx.insert(schema.referrals).values({
        referrerId: referrer.id,
        referredId: userId,
        reward
      });
      
      // 4. Registrar no histórico de pontos
      await tx.insert(schema.pointsHistory).values({
        userId: referrer.id,
        points: reward,
        description: `Convite aceito - ${user.username || 'Usuário'}`
      });
    });
    
    res.json({
      status: 'success',
      message: `Código validado! ${referrer.username} ganhou ${reward} pontos!`,
      data: {
        referrer_username: referrer.username,
        reward
      }
    });
    
  } catch (error) {
    console.error('[INVITE] Erro ao validar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao validar código'
    });
  }
});

export default router;
