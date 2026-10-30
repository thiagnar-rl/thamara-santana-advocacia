import { Compromisso } from '../models/compromisso.model';
import { Processo } from '../models/processo.model';
import { compromissosView } from './compromisso.view';

/**
 * VIEW — Processo
 * Converte a linha do banco no JSON público da API.
 */

export function processoView(p: Processo) {
  return {
    id: Number(p.id),
    numero: p.numero,
    cliente: p.cliente,
    cliente_id: p.cliente_id == null ? null : Number(p.cliente_id), // [F6]
    parte_contraria: p.parte_contraria ?? null,
    tribunal: p.tribunal ?? null,
    area: p.area ?? null,
    status: p.status,
    observacoes: p.observacoes ?? null,
    criado_em: p.criado_em,
    atualizado_em: p.atualizado_em,
    total_pendentes: Number(p.total_pendentes ?? 0),
    proximo_compromisso: p.proximo_compromisso ?? null,
  };
}

export function processosView(lista: Processo[]) {
  return lista.map(processoView);
}

/** Ficha do processo: dados + compromissos. */
export function processoDetalheView(p: Processo, compromissos: Compromisso[]) {
  return { processo: processoView(p), compromissos: compromissosView(compromissos) };
}
