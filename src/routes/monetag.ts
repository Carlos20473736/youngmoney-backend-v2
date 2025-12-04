import { Router } from 'express';
import { db, schema } from '../db';
import { eq, and, sql, gte } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/monetag/session
 * Criar sessão ativa para mapear postbacks
 */
router.post('/session', async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    
    if (!userId || !userEmail) {
      return res.json({
        success: false,
        message: 'userId e userEmail são obrigatórios'
      });
    }
    
    // Criar sessão com expiração de 5 minutos
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await db.insert(schema.activeSessions).values({
      userId,
      userEmail,
      expiresAt
    });
    
    console.log(`[SESSION] Criada para ${userEmail} (expira em 5min)`);
    
    res.json({
      success: true,
      message: 'Sessão criada',
      data: { expiresAt }
    });
    
  } catch (error) {
    console.error('[SESSION] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar sessão'
    });
  }
});

/**
 * GET /api/monetag/postback
 * Receber postback do Monetag
 */
router.get('/postback', async (req, res) => {
  try {
    const { event_type, sub_id, sub_id2, revenue } = req.query;
    
    console.log('[POSTBACK] Recebido:', { event_type, sub_id, sub_id2, revenue });
    
    // Verificar se é postback com macros literais (ignorar)
    if (sub_id === '{sub_id}' || sub_id2 === '{sub_id2}') {
      console.log('[POSTBACK] Ignorado - macros literais');
      return res.send('OK');
    }
    
    let userId = sub_id as string;
    let userEmail = sub_id2 as string;
    
    // Se não tiver dados reais, buscar sessão ativa
    if (!userId || !userEmail || userId === '{sub_id}' || userEmail === '{sub_id2}') {
      const now = new Date();
      const activeSession = await db.query.activeSessions.findFirst({
        where: gte(schema.activeSessions.expiresAt, now),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)]
      });
      
      if (activeSession) {
        userId = activeSession.userId;
        userEmail = activeSession.userEmail;
        console.log(`[POSTBACK] Mapeado para sessão: ${userEmail}`);
      } else {
        console.log('[POSTBACK] Nenhuma sessão ativa encontrada');
        return res.send('OK');
      }
    }
    
    // Registrar evento
    await db.insert(schema.monetagEvents).values({
      userId,
      userEmail,
      eventType: event_type as string || 'unknown',
      revenue: revenue ? parseFloat(revenue as string).toFixed(6) : '0.000000'
    });
    
    console.log(`[POSTBACK] ✅ Registrado: ${event_type} para ${userEmail}`);
    
    res.send('OK');
    
  } catch (error) {
    console.error('[POSTBACK] Erro:', error);
    res.send('OK'); // Sempre retornar OK para Monetag
  }
});

/**
 * GET /api/monetag/stats
 * Obter estatísticas de impressões e cliques
 */
router.get('/stats', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json({
        success: false,
        message: 'Email é obrigatório'
      });
    }
    
    // Buscar eventos do usuário
    const events = await db.select()
      .from(schema.monetagEvents)
      .where(eq(schema.monetagEvents.userEmail, email as string));
    
    // Contar impressões e cliques
    const impressions = events.filter(e => e.eventType === 'impression').length;
    const clicks = events.filter(e => e.eventType === 'click').length;
    
    // Calcular receita total
    const totalRevenue = events.reduce((sum, e) => {
      return sum + parseFloat(e.revenue?.toString() || '0');
    }, 0);
    
    res.json({
      success: true,
      data: {
        impressions,
        clicks,
        totalRevenue: totalRevenue.toFixed(6)
      }
    });
    
  } catch (error) {
    console.error('[STATS] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * DELETE /api/monetag/cleanup
 * Limpar sessões expiradas (executar periodicamente)
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const now = new Date();
    
    const result = await db.delete(schema.activeSessions)
      .where(sql`${schema.activeSessions.expiresAt} < ${now}`);
    
    console.log('[CLEANUP] Sessões expiradas removidas');
    
    res.json({
      success: true,
      message: 'Sessões expiradas removidas'
    });
    
  } catch (error) {
    console.error('[CLEANUP] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar sessões'
    });
  }
});

export default router;
