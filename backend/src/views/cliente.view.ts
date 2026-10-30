import { Aniversariante, Cliente, dataDeAniversario } from '../models/cliente.model';
import { Processo } from '../models/processo.model';
import { proximoAniversario } from '../utils/documentos';
import { processosView } from './processo.view';

/**
 * VIEW — Cliente
 * [F6] Converte a linha do banco no JSON público da API (sem usuario_id),
 * já com o próximo aniversário calculado para os avisos.
 * Solicitado por: Thamara Santana (teste de 30/10/2026).
 */
export function clienteView(c: Cliente, dataHoje: string) {
  const { usuario_id, total_processos, ...dados } = c;
  return {
    ...dados,
    id: Number(c.id),
    total_processos: Number(total_processos ?? 0),
    aniversario: proximoAniversario(dataDeAniversario(c), dataHoje),
  };
}

export function clientesView(lista: Cliente[], dataHoje: string) {
  return lista.map((c) => clienteView(c, dataHoje));
}

/** Ficha do cliente: dados + processos vinculados. */
export function clienteDetalheView(c: Cliente, processos: Processo[], dataHoje: string) {
  return { cliente: clienteView(c, dataHoje), processos: processosView(processos) };
}

/** Lista de aniversariantes para o aviso. */
export function aniversariantesView(lista: Aniversariante[], dataHoje: string) {
  return lista.map((a) => clienteView(a.cliente, dataHoje));
}
