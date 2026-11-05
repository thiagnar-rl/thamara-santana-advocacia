import crypto from 'node:crypto';
import { segredoDoSistema } from './token';

/**
 * [F8] Cifra e decifra textos sensíveis guardados no banco (ex.: o acesso à conta Google).
 * AES-256-GCM, com a chave derivada do JWT_SECRET: quem tiver só o banco não consegue ler.
 * Solicitado por Thamara Santana (cliente) (04/11/2026).
 */

function chave(): Buffer {
  return crypto.createHash('sha256').update(`google-contas:${segredoDoSistema()}`).digest();
}

/** Devolve "iv.tag.conteudo" em base64url. */
export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv('aes-256-gcm', chave(), iv);
  const conteudo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
  return [iv, cifra.getAuthTag(), conteudo].map((b) => b.toString('base64url')).join('.');
}

/** Devolve o texto original, ou null se o valor foi adulterado ou cifrado com outro segredo. */
export function decifrar(valor: string): string | null {
  try {
    const [iv, tag, conteudo] = valor.split('.').map((p) => Buffer.from(p, 'base64url'));
    const decifra = crypto.createDecipheriv('aes-256-gcm', chave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(conteudo), decifra.final()]).toString('utf8');
  } catch {
    return null;
  }
}
