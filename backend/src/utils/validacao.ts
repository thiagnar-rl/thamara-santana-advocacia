/** Funções puras de validação (sem acesso a banco). */

export const TIPOS = ['audiencia', 'recurso', 'manifestacao', 'despacho'] as const;
export const PRIORIDADES = ['baixa', 'media', 'alta'] as const;
export const STATUS_COMPROMISSO = ['pendente', 'concluido'] as const;
export const STATUS_PROCESSO = ['ativo', 'suspenso', 'arquivado', 'encerrado'] as const;

export type TipoCompromisso = (typeof TIPOS)[number];
export type Prioridade = (typeof PRIORIDADES)[number];
export type StatusCompromisso = (typeof STATUS_COMPROMISSO)[number];
export type StatusProcesso = (typeof STATUS_PROCESSO)[number];

/** Converte qualquer valor em texto aparado, ou null se vazio. */
export function texto(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  const t = String(valor).trim();
  return t.length ? t : null;
}

/** Data no formato AAAA-MM-DD e que realmente existe no calendário. */
export function dataValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d;
}

/** Hora no formato HH:MM (00:00 a 23:59). */
export function horaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{2}:\d{2}$/.test(valor)) return false;
  const [h, m] = valor.split(':').map(Number);
  return h <= 23 && m <= 59;
}

export function emailValido(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

/** Verifica se o valor é um dos itens da lista. */
export function umDe<T extends readonly string[]>(lista: T, valor: unknown): valor is T[number] {
  return typeof valor === 'string' && (lista as readonly string[]).includes(valor);
}
