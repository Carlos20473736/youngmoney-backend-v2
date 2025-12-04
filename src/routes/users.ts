import { Router } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /users/profile.php
 * Obter perfil do usuário autenticado
 */
router.get('/profile.php', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.userId!)
    });
    
    if (!user) {
      return res.json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        balance: user.balance,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        referralCode: user.referralCode,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('[USERS] Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /users/update-profile.php
 * Atualizar perfil do usuário
 */
router.put('/update-profile.php', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { username, email } = req.body;
    
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, req.userId!));
    
    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('[USERS] Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /users/balance.php
 * Obter saldo do usuário
 */
router.get('/balance.php', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.userId!)
    });
    
    if (!user) {
      return res.json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        balance: user.balance,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn
      }
    });
    
  } catch (error) {
    console.error('[USERS] Erro ao buscar saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
