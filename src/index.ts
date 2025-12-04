import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db';
import { decryptMiddleware } from './middleware/decrypt';

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import monetagRoutes from './routes/monetag';
import spinRoutes from './routes/spin';
import withdrawalsRoutes from './routes/withdrawals';
import rankingRoutes from './routes/ranking';
import invitesRoutes from './routes/invites';
import checkinRoutes from './routes/checkin';
import notificationsRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware de descriptografia (para compatibilidade com app Android)
app.use(decryptMiddleware);

// Rotas de autenticação
app.use('/auth', authRoutes);
app.use('/api/v1/auth', authRoutes); // Alias para compatibilidade

// Rotas de usuários
app.use('/users', usersRoutes);
app.use('/user', usersRoutes); // Alias

// Rotas do Monetag
app.use('/api/monetag', monetagRoutes);

// Rotas de spin (roleta)
app.use('/api/v1/spin', spinRoutes);

// Rotas de saques
app.use('/withdraw', withdrawalsRoutes);
app.use('/withdrawals', withdrawalsRoutes); // Alias

// Rotas de ranking
app.use('/ranking', rankingRoutes);

// Rotas de convites
app.use('/invite', invitesRoutes);
app.use('/api/v1/invite', invitesRoutes); // Alias

// Rotas de check-in e histórico de pontos
app.use('/api/v1/checkin', checkinRoutes);
app.use('/history/points', checkinRoutes);

// Rotas de notificações
app.use('/notifications', notificationsRoutes);

// Rotas de configurações
app.use('/settings', settingsRoutes);
app.use('/public/quick-values', settingsRoutes); // Alias

// Rota de health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'YoungMoney API - Railway + MySQL',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected'
  });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
async function start() {
  try {
    // Testar conexão com banco de dados
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Não foi possível conectar ao banco de dados');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🚀 YoungMoney API v2.0 iniciada!');
      console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🗄️  Banco de dados: MySQL (Railway)`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log('  - POST /auth/device-login.php');
      console.log('  - POST /auth/google-login.php');
      console.log('  - GET  /user/profile.php');
      console.log('  - GET  /user/balance.php');
      console.log('  - GET  /api/v1/spin');
      console.log('  - POST /api/v1/spin');
      console.log('  - POST /withdraw/request');
      console.log('  - GET  /withdraw/history');
      console.log('  - GET  /ranking/list');
      console.log('  - GET  /invite/my_code');
      console.log('  - POST /api/v1/invite/validate');
      console.log('  - POST /api/v1/checkin');
      console.log('  - GET  /notifications/list');
      console.log('  - GET  /api/monetag/stats');
      console.log('  - POST /api/monetag/session');
      console.log('  - GET  /api/monetag/postback');
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
