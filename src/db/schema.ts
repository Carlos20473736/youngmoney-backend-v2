import { mysqlTable, varchar, int, decimal, timestamp, text, boolean, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabela de usuários
export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }), // hash bcrypt
  deviceId: varchar('device_id', { length: 255 }).unique(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00'),
  totalEarned: decimal('total_earned', { precision: 10, scale: 2 }).default('0.00'),
  totalWithdrawn: decimal('total_withdrawn', { precision: 10, scale: 2 }).default('0.00'),
  referralCode: varchar('referral_code', { length: 20 }).unique(),
  referredBy: varchar('referred_by', { length: 255 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  deviceIdIdx: index('device_id_idx').on(table.deviceId),
  referralCodeIdx: index('referral_code_idx').on(table.referralCode),
}));

// Tabela de tarefas diárias
export const dailyTasks = mysqlTable('daily_tasks', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  taskDate: varchar('task_date', { length: 10 }).notNull(), // YYYY-MM-DD
  impressions: int('impressions').default(0),
  clicks: int('clicks').default(0),
  completed: boolean('completed').default(false),
  reward: decimal('reward', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  userDateIdx: index('user_date_idx').on(table.userId, table.taskDate),
}));

// Tabela de giros da roleta
export const spins = mysqlTable('spins', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  prize: varchar('prize', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
}));

// Tabela de saques
export const withdrawals = mysqlTable('withdrawals', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  method: varchar('method', { length: 50 }).notNull(), // pix, paypal, etc
  pixKey: varchar('pix_key', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  statusIdx: index('status_idx').on(table.status),
}));

// Tabela de convites/referrals
export const referrals = mysqlTable('referrals', {
  id: int('id').primaryKey().autoincrement(),
  referrerId: varchar('referrer_id', { length: 255 }).notNull(),
  referredId: varchar('referred_id', { length: 255 }).notNull(),
  reward: decimal('reward', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  referrerIdx: index('referrer_idx').on(table.referrerId),
  referredIdx: index('referred_idx').on(table.referredId),
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

// Tipos TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type NewDailyTask = typeof dailyTasks.$inferInsert;
export type Spin = typeof spins.$inferSelect;
export type NewSpin = typeof spins.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type MonetagEvent = typeof monetagEvents.$inferSelect;
export type NewMonetagEvent = typeof monetagEvents.$inferInsert;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type NewActiveSession = typeof activeSessions.$inferInsert;
