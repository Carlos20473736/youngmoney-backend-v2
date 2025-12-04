import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Criar pool de conexões MySQL
const poolConnection = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'youngmoney',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Criar instância do Drizzle
export const db = drizzle(poolConnection, { schema, mode: 'default' });

// Testar conexão
export async function testConnection() {
  try {
    const connection = await poolConnection.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error);
    return false;
  }
}

export { schema };
