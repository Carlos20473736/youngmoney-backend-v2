import { Router } from 'express';
import { db, schema } from '../db';
import { eq, and, sql, gte } from 'drizzle-orm';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/v1/spin
 * Obter informações da roleta (giros restantes, valores dos prêmios)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    // Buscar configurações da roleta
    const settings = await db.select()
      .from(schema.rouletteSettings);
    
    let prizeValues: number[] = [100, 250, 500, 750, 1000, 1500, 2000, 5000];
    let maxDailySpins = 10;
    
    settings.forEach(setting => {
      if (setting.settingKey === 'max_daily_spins') {
        maxDailySpins = parseInt(setting.settingValue);
      } else if (setting.settingKey.startsWith('prize_')) {
        const index = parseInt(setting.settingKey.replace('prize_', ''));
        prizeValues[index] = parseInt(setting.settingValue);
      }
    });
    
    // Contar giros de hoje
    const today = new Date().toISOString().split('T')[0];
    const spinsToday = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.spinHistory)
      .where(and(
        eq(schema.spinHistory.userId, userId),
        sql`DATE(${schema.spinHistory.createdAt}) = ${today}`
      ));
    
    const spinsCount = Number(spinsToday[0]?.count || 0);
    const spinsRemaining = maxDailySpins - spinsCount;
    
    // Determinar saudação
    const hour = new Date().getHours();
    let greeting = 'BOA NOITE';
    if (hour >= 5 && hour < 12) greeting = 'BOM DIA';
    else if (hour >= 12 && hour < 18) greeting = 'BOA TARDE';
    
    res.json({
      status: 'success',
      data: {
        greeting,
        spins_remaining: spinsRemaining,
        spins_today: spinsCount,
        max_daily_spins: maxDailySpins,
        prize_values: prizeValues,
        server_time: new Date().toISOString(),
        server_timestamp: Math.floor(Date.now() / 1000)
      }
    });
    
  } catch (error) {
    console.error('[SPIN] Erro ao buscar info:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar informações da roleta'
    });
  }
});

/**
 * POST /api/v1/spin
 * Girar a roleta
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    
    // Buscar configurações da roleta
    const settings = await db.select()
      .from(schema.rouletteSettings);
    
    let prizeValues: number[] = [100, 250, 500, 750, 1000, 1500, 2000, 5000];
    let maxDailySpins = 10;
    
    settings.forEach(setting => {
      if (setting.settingKey === 'max_daily_spins') {
        maxDailySpins = parseInt(setting.settingValue);
      } else if (setting.settingKey.startsWith('prize_')) {
        const index = parseInt(setting.settingKey.replace('prize_', ''));
        prizeValues[index] = parseInt(setting.settingValue);
      }
    });
    
    // Contar giros de hoje
    const today = new Date().toISOString().split('T')[0];
    const spinsToday = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.spinHistory)
      .where(and(
        eq(schema.spinHistory.userId, userId),
        sql`DATE(${schema.spinHistory.createdAt}) = ${today}`
      ));
    
    const spinsCount = Number(spinsToday[0]?.count || 0);
    
    // Verificar se ainda tem giros
    if (spinsCount >= maxDailySpins) {
      return res.json({
        status: 'error',
        message: 'Você já usou todos os giros de hoje. Volte amanhã!',
        data: {
          spins_remaining: 0,
          spins_today: spinsCount,
          max_daily_spins: maxDailySpins
        }
      });
    }
    
    // Sortear prêmio
    const prizeIndex = Math.floor(Math.random() * prizeValues.length);
    const prizeValue = prizeValues[prizeIndex];
    
    // Transação: registrar giro + adicionar pontos
    await db.transaction(async (tx) => {
      // 1. Registrar giro
      await tx.insert(schema.spinHistory).values({
        userId,
        prizeValue,
        prizeIndex
      });
      
      // 2. Adicionar pontos ao usuário
      await tx.update(schema.users)
        .set({
          points: sql`${schema.users.points} + ${prizeValue}`,
          dailyPoints: sql`${schema.users.dailyPoints} + ${prizeValue}`
        })
        .where(eq(schema.users.id, userId));
      
      // 3. Registrar no histórico de pontos
      await tx.insert(schema.pointsHistory).values({
        userId,
        points: prizeValue,
        description: `Roleta da Sorte - Ganhou ${prizeValue} pontos`
      });
    });
    
    // Buscar saldo atualizado
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId)
    });
    
    const spinsRemaining = maxDailySpins - (spinsCount + 1);
    
    // Determinar saudação
    const hour = new Date().getHours();
    let greeting = 'BOA NOITE';
    if (hour >= 5 && hour < 12) greeting = 'BOM DIA';
    else if (hour >= 12 && hour < 18) greeting = 'BOA TARDE';
    
    res.json({
      status: 'success',
      message: `Você ganhou ${prizeValue} pontos!`,
      data: {
        greeting,
        prize_value: prizeValue,
        prize_index: prizeIndex,
        spins_remaining: spinsRemaining,
        spins_today: spinsCount + 1,
        max_daily_spins: maxDailySpins,
        new_balance: user?.points || 0,
        server_time: new Date().toISOString(),
        server_timestamp: Math.floor(Date.now() / 1000)
      }
    });
    
  } catch (error) {
    console.error('[SPIN] Erro ao girar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao processar giro'
    });
  }
});

export default router;
