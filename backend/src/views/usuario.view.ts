import { Usuario } from '../models/usuario.model';

/**
 * VIEW — Usuário
 * Define o que é enviado ao frontend. Nunca expõe o hash da senha.
 */

export interface UsuarioJSON {
  id: number;
  nome: string;
  email: string;
}

export function usuarioView(u: Pick<Usuario, 'id' | 'nome' | 'email'>): UsuarioJSON {
  return { id: Number(u.id), nome: u.nome, email: u.email };
}

export function sessaoView(token: string, u: Pick<Usuario, 'id' | 'nome' | 'email'>) {
  return { token, usuario: usuarioView(u) };
}
