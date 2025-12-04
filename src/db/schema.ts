import { mysqlTable, varchar, int, decimal, timestamp, text, boolean, index, tinyint } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabela de usuários
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }), // hash bcrypt
  deviceId: varchar('device_id', { length: 255 }).unique(),
  points: int('points').default(0), // saldo em pontos
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00'), // saldo em reais
  dailyPoints: int('daily_points').default(0), // pontos do dia (para ranking)
  totalEarned: int('total_earned').default(0),
  totalWithdrawn: decimal('total_withdrawn', { precision: 10, scale: 2 }).default('0.00'),
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredBy: varchar('referred_by', { length: 255 }),
  hasUsedInviteCode: tinyint('has_used_invite_code').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  deviceIdIdx: index('device_id_idx').on(table.deviceId),
  referralCodeIdx: index('referral_code_idx').on(table.referralCode),
}));

// Tabela de giros da roleta
export const spinHistory = mysqlTable('spin_history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  prizeValue: int('prize_value').notNull(),
  prizeIndex: int('prize_index').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
}));

// Tabela de configurações da roleta
export const rouletteSettings = mysqlTable('roulette_settings', {
  id: int('id').primaryKey().autoincrement(),
  settingKey: varchar('setting_key', { length: 50 }).unique().notNull(),
  settingValue: varchar('setting_value', { length: 255 }).notNull(),
}, (table) => ({
  keyIdx: index('setting_key_idx').on(table.settingKey),
}));

// Tabela de saques
export const withdrawals = mysqlTable('withdrawals', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  pixType: varchar('pix_type', { length: 50 }),
  pixKey: varchar('pix_key', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  statusIdx: index('status_idx').on(table.status),
}));

// Tabela de valores rápidos de saque
export const withdrawalQuickValues = mysqlTable('withdrawal_quick_values', {
  id: int('id').primaryKey().autoincrement(),
  valueAmount: decimal('value_amount', { precision: 10, scale: 2 }).notNull(),
  isActive: tinyint('is_active').default(1),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  activeIdx: index('is_active_idx').on(table.isActive),
}));

// Tabela de histórico de pontos
export const pointsHistory = mysqlTable('points_history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  points: int('points').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
}));

// Tabela de transações de pontos
export const pointTransactions = mysqlTable('point_transactions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  points: decimal('points', { precision: 10, scale: 2 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // credit, debit
  description: text('description'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  typeIdx: index('type_idx').on(table.type),
}));

// Tabela de convites/referrals
export const referrals = mysqlTable('referrals', {
  id: int('id').primaryKey().autoincrement(),
  referrerId: int('referrer_id').notNull(),
  referredId: int('referred_id').notNull(),
  reward: int('reward').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  referrerIdx: index('referrer_idx').on(table.referrerId),
  referredIdx: index('referred_idx').on(table.referredId),
}));

// Tabela de configurações do sistema
export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().autoincrement(),
  settingKey: varchar('setting_key', { length: 100 }).unique().notNull(),
  settingValue: text('setting_value'),
  description: text('description'),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  keyIdx: index('setting_key_idx').on(table.settingKey),
}));

// Tabela de eventos Monetag (para tracking de anúncios)
export const monetagEvents = mysqlTable('monetag_events', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // impression, click
  revenue: decimal('revenue', { precision: 10, scale: 6 }).default('0.000000'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  emailIdx: index('email_idx').on(table.userEmail),
  eventTypeIdx: index('event_type_idx').on(table.eventType),
}));

// Tabela de sessões ativas (para Monetag postback mapping)
export const activeSessions = mysqlTable('active_sessions', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  expiresAtIdx: index('expires_at_idx').on(table.expiresAt),
}));

// Tabela de notificações
export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).default('info'), // info, success, warning, error
  isRead: tinyint('is_read').default(0),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  isReadIdx: index('is_read_idx').on(table.isRead),
}));

// Tipos TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SpinHistory = typeof spinHistory.$inferSelect;
export type NewSpinHistory = typeof spinHistory.$inferInsert;
export type RouletteSettings = typeof rouletteSettings.$inferSelect;
export type NewRouletteSettings = typeof rouletteSettings.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
export type WithdrawalQuickValue = typeof withdrawalQuickValues.$inferSelect;
export type NewWithdrawalQuickValue = typeof withdrawalQuickValues.$inferInsert;
export type PointsHistory = typeof pointsHistory.$inferSelect;
export type NewPointsHistory = typeof pointsHistory.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;
export type MonetagEvent = typeof monetagEvents.$inferSelect;
export type NewMonetagEvent = typeof monetagEvents.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type NewActiveSession = typeof activeSessions.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
