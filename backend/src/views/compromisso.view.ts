import { Compromisso } from '../models/compromisso.model';

/**
 * VIEW — Compromisso
 * Converte a linha do banco no JSON público da API
 * (sem o usuario_id, que é um detalhe interno).
 */

export interface CompromissoJSON {
  id: number;
  processo_id: number | null;
  tipo: string;
  titulo: string;
  data: string;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  prioridade: string;
  status: string;
  concluido_em: string | null;
  processo_numero: string | null;
  processo_cliente: string | null;
}

export function compromissoView(c: Compromisso): CompromissoJSON {
  return {
    id: Number(c.id),
    processo_id: c.processo_id === null ? null : Number(c.processo_id),
    tipo: c.tipo,
    titulo: c.titulo,
    data: c.data,
    hora: c.hora ?? null,
    local: c.local ?? null,
    descricao: c.descricao ?? null,
    prioridade: c.prioridade,
    status: c.status,
    concluido_em: c.concluido_em ?? null,
    processo_numero: c.processo_numero ?? null,
    processo_cliente: c.processo_cliente ?? null,
  };
}

export function compromissosView(lista: Compromisso[]): CompromissoJSON[] {
  return lista.map(compromissoView);
}
