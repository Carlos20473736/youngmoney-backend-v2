import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'default-iv-16ch';

/**
 * Descriptografa dados criptografados pelo app Android
 */
export function decrypt(encryptedData: string): string | null {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV);
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return null;
  }
}

/**
 * Criptografa dados para enviar ao app Android
 */
export function encrypt(data: string): string {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_IV);
    
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return encrypted.toString();
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    throw error;
  }
}

/**
 * Gera código de referral único
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
