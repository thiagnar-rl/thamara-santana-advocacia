import { Compromisso, FiltroCompromissos, TipoCompromisso } from '../models';
import { dataLonga, dataRelativa, deISO, diaDaSemana, paraISO } from '../rotulos';

/**
 * MODEL (lógica de apresentação da Agenda)
 * Funções puras, sem Angular: fáceis de testar e reutilizar.
 * O componente (Controller) só chama estas funções e guarda o resultado.
 */

export type Periodo = 'proximos' | 'atrasados' | 'concluidos' | 'todos';

export interface Celula {
  data: string;
  dia: number;
  doMes: boolean;
  hoje: boolean;
  tipos: TipoCompromisso[];
  total: number;
}

export interface GrupoDia {
  data: string;
  titulo: string;
  subtitulo: string;
  itens: Compromisso[];
}

/** "2026-10-01" para qualquer dia de outubro de 2026. */
export function primeiroDiaDoMes(data: Date): string {
  return paraISO(new Date(data.getFullYear(), data.getMonth(), 1));
}

/** Avança (delta > 0) ou volta (delta < 0) meses. */
export function mudarMes(mesISO: string, delta: number): string {
  const atual = deISO(mesISO);
  return primeiroDiaDoMes(new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
}

/** As 42 casinhas (6 semanas, começando no domingo) do calendário. */
export function gerarCelulas(mesISO: string, compromissos: Compromisso[], hoje: string): Celula[] {
  const inicio = deISO(mesISO);
  const mesAtual = inicio.getMonth();

  const porDia = new Map<string, Compromisso[]>();
  for (const c of compromissos) {
    porDia.set(c.data, [...(porDia.get(c.data) ?? []), c]);
  }

  const primeiro = new Date(inicio);
  primeiro.setDate(1 - inicio.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(primeiro);
    d.setDate(primeiro.getDate() + i);
    const iso = paraISO(d);
    const doDia = porDia.get(iso) ?? [];
    return {
      data: iso,
      dia: d.getDate(),
      doMes: d.getMonth() === mesAtual,
      hoje: iso === hoje,
      tipos: [...new Set(doDia.map((c) => c.tipo))],
      total: doDia.length,
    };
  });
}

/** Intervalo de datas que o calendário do mês exibe (inclui dias vizinhos). */
export function intervaloDoCalendario(mesISO: string): { de: string; ate: string } {
  const inicio = deISO(mesISO);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  return {
    de: paraISO(new Date(inicio.getFullYear(), inicio.getMonth(), -6)),
    ate: paraISO(new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 14)),
  };
}

/** Agrupa a lista (já ordenada) por data, mantendo a ordem. */
export function agruparPorDia(lista: Compromisso[]): GrupoDia[] {
  const grupos: GrupoDia[] = [];
  for (const c of lista) {
    let grupo = grupos.find((g) => g.data === c.data);
    if (!grupo) {
      grupo = {
        data: c.data,
        titulo: dataRelativa(c.data),
        subtitulo: `${diaDaSemana(c.data)} · ${dataLonga(c.data)}`,
        itens: [],
      };
      grupos.push(grupo);
    }
    grupo.itens.push(c);
  }
  return grupos;
}

/** Traduz os filtros da tela para os parâmetros da API. */
export function montarFiltro(
  periodo: Periodo,
  dia: string | null,
  tipo: TipoCompromisso | null,
  hoje: string,
): FiltroCompromissos {
  if (dia) return { de: dia, ate: dia, tipo };

  switch (periodo) {
    case 'proximos':
      return { de: hoje, status: 'pendente', tipo };
    case 'atrasados':
      return { periodo: 'atrasados', tipo };
    case 'concluidos':
      return { status: 'concluido', tipo };
    default:
      return { tipo };
  }
}
