/** Funções puras de data (formato AAAA-MM-DD, fuso do computador). */

export function formatarISO(data: Date): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Data de hoje (AAAA-MM-DD). */
export function hoje(): string {
  return formatarISO(new Date());
}

/** Soma (ou subtrai, se negativo) dias a uma data AAAA-MM-DD. */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return formatarISO(new Date(a, m - 1, d + dias));
}

/** Primeiro dia do mês da data informada. */
export function inicioDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}
