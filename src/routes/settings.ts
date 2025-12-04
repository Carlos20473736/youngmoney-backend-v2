import { Router } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * GET /settings/get
 * Obter configurações do sistema
 */
router.get('/get', async (req, res) => {
  try {
    const settings = await db.select()
      .from(schema.systemSettings);
    
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      settingsObj[s.settingKey] = s.settingValue || '';
    });
    
    res.json({
      status: 'success',
      data: settingsObj
    });
    
  } catch (error) {
    console.error('[SETTINGS] Erro ao buscar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar configurações'
    });
  }
});

/**
 * POST /settings/update
 * Atualizar configuração (admin)
 */
router.post('/update', async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    
    if (!setting_key) {
      return res.status(400).json({
        status: 'error',
        message: 'setting_key é obrigatório'
      });
    }
    
    // Verificar se existe
    const existing = await db.query.systemSettings.findFirst({
      where: eq(schema.systemSettings.settingKey, setting_key)
    });
    
    if (existing) {
      // Atualizar
      await db.update(schema.systemSettings)
        .set({ settingValue: setting_value })
        .where(eq(schema.systemSettings.settingKey, setting_key));
    } else {
      // Criar
      await db.insert(schema.systemSettings).values({
        settingKey: setting_key,
        settingValue: setting_value
      });
    }
    
    res.json({
      status: 'success',
      message: 'Configuração atualizada'
    });
    
  } catch (error) {
    console.error('[SETTINGS] Erro ao atualizar:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar configuração'
    });
  }
});

/**
 * GET /public/quick-values
 * Obter valores rápidos de saque
 */
router.get('/quick-values', async (req, res) => {
  try {
    const values = await db.select()
      .from(schema.withdrawalQuickValues)
      .where(eq(schema.withdrawalQuickValues.isActive, 1));
    
    res.json({
      status: 'success',
      data: values.map(v => ({
        id: v.id,
        value: parseFloat(v.valueAmount.toString())
      }))
    });
    
  } catch (error) {
    console.error('[SETTINGS] Erro ao buscar quick values:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar valores rápidos'
    });
  }
});

export default router;
