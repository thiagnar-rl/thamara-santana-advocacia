import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { executar, todos, um } from '../config/database';
import { SENHA_MINIMA, Usuario } from './usuario.model';

/**
 * MODEL — Recuperação de senha ("Esqueci minha senha")
 * [F3] Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 *
 * Como funciona:
 * 1. A usuária informa o e-mail; o sistema cria um código aleatório e envia um link por e-mail.
 * 2. No banco fica só o HASH (SHA-256) do código — quem ler o banco não consegue usar o link.
 * 3. O link vale 1 hora e só pode ser usado uma vez. Ao trocar a senha, todos os outros
 *    links pendentes daquela usuária deixam de valer.
 * 4. No máximo 3 pedidos a cada 15 minutos por conta (evita encher a caixa de e-mail).
 */

export const VALIDADE_MINUTOS = 60;
export const LIMITE_PEDIDOS = 3;
export const JANELA_LIMITE_MINUTOS = 15;

interface Pedido {
  id: number;
  usuario_id: number;
  expira_em: string;
  usado_em: string | null;
}

export function hashDoToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function minutosDepois(agora: Date, minutos: number): string {
  return new Date(agora.getTime() + minutos * 60_000).toISOString();
}

export const RecuperacaoModel = {
  /**
   * Cria um código de recuperação para a usuária e devolve o código "puro" (só ele vai no e-mail).
   * Devolve null se o limite de pedidos recentes foi atingido.
   */
  async criar(usuario: Pick<Usuario, 'id'>, agora = new Date()): Promise<string | null> {
    const recentes = await todos<{ id: number }>(
      'SELECT id FROM recuperacoes_senha WHERE usuario_id = ? AND criado_em > ?',
      usuario.id,
      minutosDepois(agora, -JANELA_LIMITE_MINUTOS),
    );
    if (recentes.length >= LIMITE_PEDIDOS) return null;

    const token = crypto.randomBytes(32).toString('base64url');
    await executar(
      'INSERT INTO recuperacoes_senha (usuario_id, token_hash, criado_em, expira_em) VALUES (?, ?, ?, ?)',
      usuario.id,
      hashDoToken(token),
      agora.toISOString(),
      minutosDepois(agora, VALIDADE_MINUTOS),
    );
    return token;
  },

  /** Confere se o código existe, não foi usado e não expirou. Devolve o id da usuária ou null. */
  async validar(token: string, agora = new Date()): Promise<number | null> {
    if (!token || token.length < 20) return null;
    const pedido = await um<Pedido>('SELECT * FROM recuperacoes_senha WHERE token_hash = ?', hashDoToken(token));
    if (!pedido || pedido.usado_em || pedido.expira_em <= agora.toISOString()) return null;
    return Number(pedido.usuario_id);
  },

  /** Valida a nova senha (mesma regra do cadastro). */
  validarSenha(senha: unknown): string | null {
    const s = String(senha ?? '');
    if (s.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    if (s.length > 200) return 'A senha é muito longa.';
    return null;
  },

  /**
   * Troca a senha usando o código. Marca o código como usado e invalida os demais.
   * Devolve o id da usuária, ou null se o código for inválido/expirado.
   */
  async redefinir(token: string, novaSenha: string, agora = new Date()): Promise<number | null> {
    const usuarioId = await RecuperacaoModel.validar(token, agora);
    if (!usuarioId) return null;
    await executar('UPDATE usuarios SET senha_hash = ? WHERE id = ?', bcrypt.hashSync(novaSenha, 10), usuarioId);
    await executar(
      'UPDATE recuperacoes_senha SET usado_em = ? WHERE usuario_id = ? AND usado_em IS NULL',
      agora.toISOString(),
      usuarioId,
    );
    return usuarioId;
  },
};
