import { Router } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { generateReferralCode } from '../utils/crypto';

const router = Router();

/**
 * POST /auth/device-login.php
 * Login por device ID (compatível com app Android)
 */
router.post('/device-login.php', async (req, res) => {
  try {
    const { deviceId, deviceInfo } = req.body;
    
    if (!deviceId) {
      return res.json({ 
        success: false, 
        message: 'Device ID não fornecido' 
      });
    }
    
    console.log('[AUTH] Device login:', deviceId);
    
    // Buscar usuário por deviceId
    let user = await db.query.users.findFirst({
      where: eq(schema.users.deviceId, deviceId)
    });
    
    // Se não existir, criar novo usuário
    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = generateReferralCode();
      
      const [newUser] = await db.insert(schema.users).values({
        id: userId,
        deviceId: deviceId,
        username: `Usuário ${Math.floor(Math.random() * 10000)}`,
        referralCode: referralCode,
        balance: '0.00',
        totalEarned: '0.00',
        totalWithdrawn: '0.00',
      });
      
      user = await db.query.users.findFirst({
        where: eq(schema.users.deviceId, deviceId)
      });
      
      console.log('[AUTH] Novo usuário criado:', userId);
    }
    
    if (!user) {
      return res.json({ 
        success: false, 
        message: 'Erro ao criar usuário' 
      });
    }
    
    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      deviceId: user.deviceId || undefined
    });
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          balance: user.balance,
          totalEarned: user.totalEarned,
          referralCode: user.referralCode
        }
      }
    });
    
  } catch (error) {
    console.error('[AUTH] Erro no device login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

/**
 * POST /auth/google-login.php
 * Login com Google (compatível com app Android)
 */
router.post('/google-login.php', async (req, res) => {
  try {
    const { email, name, googleId, deviceId } = req.body;
    
    if (!email) {
      return res.json({ 
        success: false, 
        message: 'Email não fornecido' 
      });
    }
    
    console.log('[AUTH] Google login:', email);
    
    // Buscar usuário por email
    let user = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });
    
    // Se não existir, criar novo usuário
    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const referralCode = generateReferralCode();
      
      await db.insert(schema.users).values({
        id: userId,
        email: email,
        username: name || email.split('@')[0],
        deviceId: deviceId || null,
        referralCode: referralCode,
        balance: '0.00',
        totalEarned: '0.00',
        totalWithdrawn: '0.00',
      });
      
      user = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      console.log('[AUTH] Novo usuário Google criado:', userId);
    } else if (deviceId && !user.deviceId) {
      // Atualizar deviceId se não existir
      await db.update(schema.users)
        .set({ deviceId: deviceId })
        .where(eq(schema.users.id, user.id));
    }
    
    if (!user) {
      return res.json({ 
        success: false, 
        message: 'Erro ao criar usuário' 
      });
    }
    
    // Gerar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email || undefined,
      deviceId: user.deviceId || undefined
    });
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          balance: user.balance,
          totalEarned: user.totalEarned,
          referralCode: user.referralCode
        }
      }
    });
    
  } catch (error) {
    console.error('[AUTH] Erro no Google login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;
