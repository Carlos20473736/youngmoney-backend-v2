# YoungMoney Backend API

Backend Node.js/TypeScript para o app YoungMoney usando **Railway + MySQL** (sem Aiven).

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **MySQL** - Banco de dados (Railway)
- **Drizzle ORM** - ORM TypeScript-first
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Crypto-JS** - Criptografia compatível com Android

## 📦 Estrutura do Projeto

```
youngmoney-backend/
├── src/
│   ├── db/
│   │   ├── index.ts          # Conexão com MySQL
│   │   └── schema.ts          # Schema do banco (Drizzle)
│   ├── routes/
│   │   ├── auth.ts            # Rotas de autenticação
│   │   ├── users.ts           # Rotas de usuários
│   │   └── monetag.ts         # Rotas do Monetag
│   ├── middleware/
│   │   ├── auth.ts            # Middleware de autenticação JWT
│   │   └── decrypt.ts         # Middleware de descriptografia
│   ├── utils/
│   │   ├── crypto.ts          # Utilitários de criptografia
│   │   └── jwt.ts             # Utilitários JWT
│   └── index.ts               # Servidor Express
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## 🗄️ Schema do Banco de Dados

### Tabelas

1. **users** - Usuários do app
2. **daily_tasks** - Tarefas diárias
3. **spins** - Giros da roleta
4. **withdrawals** - Saques
5. **referrals** - Sistema de convites
6. **monetag_events** - Eventos de anúncios (impressões/cliques)
7. **active_sessions** - Sessões ativas para mapear postbacks

## 🔧 Configuração Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Railway MySQL
MYSQL_HOST=your-mysql-host.railway.app
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=railway

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Encryption (compatível com Android)
ENCRYPTION_KEY=your-encryption-key-32-chars
ENCRYPTION_IV=your-iv-16-chars
```

### 3. Criar tabelas no banco

```bash
npm run db:push
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

### 5. Build para produção

```bash
npm run build
npm start
```

## 🚂 Deploy no Railway

### 1. Criar projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Crie um novo projeto
3. Adicione um serviço **MySQL**
4. Adicione um serviço **Node.js** (este backend)

### 2. Configurar variáveis de ambiente

No serviço Node.js, adicione as variáveis:

```
MYSQL_HOST=${{MySQL.MYSQL_HOST}}
MYSQL_PORT=${{MySQL.MYSQL_PORT}}
MYSQL_USER=${{MySQL.MYSQL_USER}}
MYSQL_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQL_DATABASE}}
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
ENCRYPTION_IV=your-iv
```

### 3. Deploy

```bash
# Fazer commit
git init
git add .
git commit -m "Initial commit"

# Conectar ao Railway
railway link

# Deploy
railway up
```

### 4. Criar tabelas no banco (produção)

```bash
railway run npm run db:push
```

## 📡 Endpoints da API

### Autenticação

- `POST /auth/device-login.php` - Login por device ID
- `POST /auth/google-login.php` - Login com Google

### Usuários

- `GET /users/profile.php` - Obter perfil (requer auth)
- `PUT /users/update-profile.php` - Atualizar perfil (requer auth)
- `GET /users/balance.php` - Obter saldo (requer auth)

### Monetag (Anúncios)

- `POST /api/monetag/session` - Criar sessão ativa
- `GET /api/monetag/postback` - Receber postback do Monetag
- `GET /api/monetag/stats` - Obter estatísticas de impressões/cliques
- `DELETE /api/monetag/cleanup` - Limpar sessões expiradas

### Health Check

- `GET /` - Informações da API
- `GET /health` - Status de saúde

## 🔐 Segurança

- **JWT** para autenticação
- **Bcrypt** para hash de senhas
- **AES-256-CBC** para criptografia de dados (compatível com Android)
- **CORS** habilitado
- **Descriptografia automática** de requests do app Android

## 🔄 Sistema de Postback Monetag

O sistema usa **sessões ativas** para mapear postbacks do Monetag aos usuários corretos:

1. App cria sessão antes de mostrar anúncio
2. Monetag envia postback (pode ter macros literais)
3. Backend busca sessão ativa mais recente
4. Mapeia postback ao usuário da sessão
5. Registra evento (impressão/click)

## 📊 Monitoramento

Logs são exibidos no console:

```
[2025-12-03T21:00:00.000Z] POST /auth/device-login.php
[AUTH] Device login: abc123
[AUTH] Novo usuário criado: user_1234567890_abc
[SESSION] Criada para user@example.com (expira em 5min)
[POSTBACK] Recebido: impression
[POSTBACK] ✅ Registrado: impression para user@example.com
```

## 🛠️ Desenvolvimento

### Visualizar banco de dados

```bash
npm run db:studio
```

Abre interface web em `https://local.drizzle.studio`

### Adicionar nova tabela

1. Editar `src/db/schema.ts`
2. Rodar `npm run db:push`

## 📝 Licença

MIT
