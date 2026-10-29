import { TipoCompromisso } from '../models';
import { InfoTipo, TIPOS } from '../rotulos';

/**
 * MODEL (lógica de apresentação do Painel e do menu) — funções puras.
 */

export interface BarraTipo extends InfoTipo {
  total: number;
  /** Largura da barra em % (o maior tipo ocupa 100%). */
  largura: number;
}

/** Barrinhas de "Pendências por tipo". */
export function distribuicaoPorTipo(porTipo: Partial<Record<TipoCompromisso, number>> | null | undefined): BarraTipo[] {
  if (!porTipo) return [];
  const maior = Math.max(1, ...TIPOS.map((t) => porTipo[t.valor] ?? 0));
  return TIPOS.map((t) => {
    const total = porTipo[t.valor] ?? 0;
    return { ...t, total, largura: (total / maior) * 100 };
  });
}

/** Soma de todas as pendências. */
export function totalPendencias(barras: BarraTipo[]): number {
  return barras.reduce((soma, b) => soma + b.total, 0);
}

/** "Thamara Santana" → "TS"; "Ana" → "A". */
export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** "Thamara Santana" → "Thamara". */
export function primeiroNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().split(/\s+/)[0] ?? '';
}
