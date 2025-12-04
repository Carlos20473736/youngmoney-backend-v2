import { Router } from 'express';
import { db, schema } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /withdrawals/request
 * Solicitar saque
 */
router.post('/request', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { amount, pix_type, pix_key } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valor inválido'
      });
    }
    
    if (!pix_type || !pix_key) {
      return res.status(400).json({
        status: 'error',
        message: 'Tipo e chave PIX são obrigatórios'
      });
    }
    
    // Buscar configurações de saque
    const settings = await db.select()
      .from(schema.systemSettings)
      .where(sql`${schema.systemSettings.settingKey} IN ('min_withdrawal', 'max_withdrawal')`);
    
    let minWithdrawal = 10;
    let maxWithdrawal = 1000;
    
    settings.forEach(setting => {
      if (setting.settingKey === 'min_withdrawal') {
        minWithdrawal = parseFloat(setting.settingValue || '10');
      } else if (setting.settingKey === 'max_withdrawal') {
        maxWithdrawal = parseFloat(setting.settingValue || '1000');
      }
    });
    
    // Buscar valores rápidos
    const quickValues = await db.select()
      .from(schema.withdrawalQuickValues)
      .where(eq(schema.withdrawalQuickValues.isActive, 1));
    
    const quickAmounts = quickValues.map(v => parseFloat(v.valueAmount.toString()));
    
    // Verificar se usuário tem saldo
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    if (!user || user.points < amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Saldo insuficiente'
      });
    }
    
    // Validar valor
    const isQuickValue = quickAmounts.includes(amount);
    const isWithinLimits = amount >= minWithdrawal && amount <= maxWithdrawal;
    
    if (!isQuickValue && !isWithinLimits) {
      if (amount < minWithdrawal) {
        return res.status(400).json({
          status: 'error',
          message: `Valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}`
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: `Valor máximo para saque é R$ ${maxWithdrawal.toFixed(2)}`
        });
      }
    }
    
    // Transação: debitar pontos + criar saque
    let withdrawalId: number = 0;
    
    await db.transaction(async (tx) => {
      // 1. Debitar pontos
      const result = await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} - ${amount}`
        })
        .where(eq(schema.users.id, userId));
      
      // 2. Criar registro de saque
      const withdrawal = await tx.insert(schema.withdrawals).values({
        userId,
        amount: amount.toString(),
        pixType: pix_type,
        pixKey: pix_key,
        status: 'pending'
      });
      
      withdrawalId = Number(withdrawal.insertId);
      
      // 3. Registrar transação
      await tx.insert(schema.pointTransactions).values({
        userId,
        points: (-amount).toString(),
        type: 'debit',
        description: `Saque solicitado - ID: ${withdrawalId}`
      });
    });
    
    res.json({
      status: 'success',
      data: {
        withdrawal_id: withdrawalId,
        amount,
        status: 'pending',
        message: 'Saque solicitado com sucesso! Aguarde a aprovação.'
      }
    });
    
  } catch (error) {
    console.error('[WITHDRAWALS] Erro ao solicitar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao solicitar saque'
    });
  }
});

/**
 * GET /withdrawals/history
 * Histórico de saques
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    const withdrawals = await db.select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.userId, userId))
      .orderBy(desc(schema.withdrawals.createdAt));
    
    res.json({
      status: 'success',
      data: withdrawals.map(w => ({
        id: w.id,
        amount: parseFloat(w.amount.toString()),
        pix_type: w.pixType,
        pix_key: w.pixKey,
        status: w.status,
        created_at: w.createdAt,
        updated_at: w.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('[WITHDRAWALS] Erro ao buscar histórico:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar histórico'
    });
  }
});

/**
 * GET /withdrawals/recent
 * Saques recentes (últimos 5)
 */
router.get('/recent', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    const withdrawals = await db.select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.userId, userId))
      .orderBy(desc(schema.withdrawals.createdAt))
      .limit(5);
    
    res.json({
      status: 'success',
      data: withdrawals.map(w => ({
        id: w.id,
        amount: parseFloat(w.amount.toString()),
        status: w.status,
        created_at: w.createdAt
      }))
    });
    
  } catch (error) {
    console.error('[WITHDRAWALS] Erro ao buscar recentes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar saques recentes'
    });
  }
});

export default router;
