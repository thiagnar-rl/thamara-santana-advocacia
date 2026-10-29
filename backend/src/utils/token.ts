import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PASTA_DADOS } from '../config/database';

let segredo: string | null = null;

/**
 * Usa o JWT_SECRET do .env. Se não existir, gera um segredo aleatório
 * uma única vez e guarda em data/.jwt-secret.
 */
function obterSegredo(): string {
  if (segredo) return segredo;
  if (process.env.JWT_SECRET) return (segredo = process.env.JWT_SECRET);

  // Na Vercel não é possível gravar arquivos: o segredo precisa vir da variável de ambiente.
  if (process.env.VERCEL) throw new Error('Configure a variável de ambiente JWT_SECRET na Vercel.');

  const arquivo = path.join(PASTA_DADOS, '.jwt-secret');
  if (fs.existsSync(arquivo)) return (segredo = fs.readFileSync(arquivo, 'utf8').trim());

  fs.mkdirSync(PASTA_DADOS, { recursive: true });
  segredo = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(arquivo, segredo, 'utf8');
  return segredo;
}

/** Gera o token de sessão (válido por 7 dias). */
export function gerarToken(usuarioId: number): string {
  return jwt.sign({ sub: String(usuarioId) }, obterSegredo(), { expiresIn: '7d' });
}

/** Devolve o id do usuário do token, ou null se for inválido/expirado. */
export function verificarToken(token: string): number | null {
  try {
    const dados = jwt.verify(token, obterSegredo()) as JwtPayload;
    const id = Number(dados.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
