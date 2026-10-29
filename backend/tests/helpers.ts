/**
 * Utilidades compartilhadas pelos testes unitários.
 * Cada teste usa um banco SQLite NOVO em memória (não toca no agenda.db).
 */
import '../src/config/env';
import { criarBancoLocal, definirBanco } from '../src/config/database';
import { CompromissoModel, DadosCompromisso } from '../src/models/compromisso.model';
import { DadosProcesso, ProcessoModel } from '../src/models/processo.model';
import { UsuarioModel } from '../src/models/usuario.model';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-somente-para-testes';

/** Cria um banco vazio em memória e passa a usá-lo. */
export async function novoBanco() {
  const banco = await criarBancoLocal(':memory:');
  definirBanco(banco);
  return banco;
}

/** Resposta falsa do Express: guarda status e corpo para conferência. */
export interface RespostaFalsa {
  statusCode: number;
  corpo: any;
  encerrada: boolean;
  status(codigo: number): RespostaFalsa;
  json(corpo: unknown): RespostaFalsa;
  end(): RespostaFalsa;
}

export function resposta(): RespostaFalsa {
  return {
    statusCode: 200,
    corpo: undefined,
    encerrada: false,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(corpo) {
      this.corpo = corpo;
      this.encerrada = true;
      return this;
    },
    end() {
      this.encerrada = true;
      return this;
    },
  };
}

/** Requisição falsa do Express. */
export function requisicao(dados: {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  usuarioId?: number;
} = {}): any {
  return { body: {}, query: {}, params: {}, headers: {}, usuarioId: 0, ...dados };
}

export function criarUsuario(email = 'thamara@teste.com', nome = 'Thamara Santana'): Promise<number> {
  return UsuarioModel.criar({ nome, email, senha: 'senha123' });
}

export function criarProcesso(usuarioId: number, extra: Partial<DadosProcesso> = {}): Promise<number> {
  return ProcessoModel.criar(usuarioId, {
    numero: '1002345-67.2026.8.26.0100',
    cliente: 'Mariana Alves Costa',
    parte_contraria: 'Banco Horizonte S.A.',
    tribunal: '12ª Vara Cível',
    area: 'Consumidor',
    status: 'ativo',
    observacoes: null,
    ...extra,
  });
}

export function criarCompromisso(usuarioId: number, extra: Partial<DadosCompromisso> = {}): Promise<number> {
  return CompromissoModel.criar(usuarioId, {
    processo_id: null,
    tipo: 'audiencia',
    titulo: 'Audiência de conciliação',
    data: '2026-10-28',
    hora: '09:30',
    local: null,
    descricao: null,
    prioridade: 'media',
    status: 'pendente',
    ...extra,
  });
}
