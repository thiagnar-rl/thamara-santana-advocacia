import bcrypt from 'bcryptjs';
import { executar, um } from '../config/database';
import { emailValido, texto } from '../utils/validacao';

/**
 * MODEL — Usuário
 * Regras de negócio e acesso à tabela "usuarios".
 */

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  criado_em: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export const SENHA_MINIMA = 6;

export const UsuarioModel = {
  /** Valida os dados de cadastro (RF01). */
  validarCadastro(corpo: unknown): { dados: DadosCadastro; erro: string | null } {
    const b = (corpo ?? {}) as Record<string, unknown>;
    const dados: DadosCadastro = {
      nome: texto(b.nome) ?? '',
      email: (texto(b.email) ?? '').toLowerCase(),
      senha: String(b.senha ?? ''),
    };

    let erro: string | null = null;
    if (!dados.nome) erro = 'Informe seu nome.';
    else if (dados.nome.length > 120) erro = 'O nome pode ter no máximo 120 caracteres.';
    else if (!emailValido(dados.email)) erro = 'Informe um e-mail válido.';
    else if (dados.senha.length < SENHA_MINIMA) erro = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;

    return { dados, erro };
  },

  async buscarPorId(id: number): Promise<Usuario | undefined> {
    return await um<Usuario>('SELECT * FROM usuarios WHERE id = ?', id);
  },

  async buscarPorEmail(email: string): Promise<Usuario | undefined> {
    return await um<Usuario>('SELECT * FROM usuarios WHERE email = ?', email.trim().toLowerCase());
  },

  /** RN01 — e-mail único. */
  async emailEmUso(email: string): Promise<boolean> {
    return !!(await UsuarioModel.buscarPorEmail(email));
  },

  /** Cria o usuário guardando apenas o hash da senha (RNF01). Devolve o id. */
  async criar(dados: DadosCadastro): Promise<number> {
    const hash = bcrypt.hashSync(dados.senha, 10);
    return (await executar(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      dados.nome,
      dados.email,
      hash,
    )).id;
  },

  /** Confere e-mail e senha. Devolve o usuário ou null. */
  async autenticar(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await UsuarioModel.buscarPorEmail(email);
    if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) return null;
    return usuario;
  },
};
