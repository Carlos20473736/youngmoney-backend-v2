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

// Rotas
app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/api/monetag', monetagRoutes);

// Rota de health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'YoungMoney API - Railway + MySQL',
    version: '1.0.0',
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
      console.log('='.repeat(50));
      console.log('🚀 YoungMoney API iniciada!');
      console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🗄️  Banco de dados: MySQL (Railway)`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
