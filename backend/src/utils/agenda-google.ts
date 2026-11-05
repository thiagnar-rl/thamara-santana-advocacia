import type { TipoCompromisso } from './validacao';

/**
 * [F8] Conversão entre um compromisso do sistema e um evento do Google Agenda (funções puras).
 * Solicitado por Thiago Rinaldi Luna (04/11/2026).
 *
 * - Título no Google: "[Audiência] Audiência de conciliação" (e "✓ " na frente quando concluído).
 *   Assim dá para saber o tipo olhando a agenda do celular, e o tipo volta certo para o sistema.
 * - Sem hora: evento de dia inteiro. Com hora: duração de 1 hora.
 * - O id do compromisso vai escondido no evento (extendedProperties.private.tsId).
 */

export const FUSO = 'America/Sao_Paulo';

const ROTULOS: Record<TipoCompromisso, string> = {
  audiencia: 'Audiência',
  recurso: 'Recurso',
  manifestacao: 'Manifestação',
  despacho: 'Despacho',
  outro: 'Outro',
};

export interface CompromissoParaGoogle {
  id: number;
  tipo: TipoCompromisso;
  titulo: string;
  data: string;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  status: 'pendente' | 'concluido';
  processo_numero?: string | null;
  processo_cliente?: string | null;
}

export interface EventoGoogle {
  id?: string;
  status?: string; // "confirmed" | "tentative" | "cancelled"
  summary?: string;
  description?: string;
  location?: string;
  updated?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties?: { private?: Record<string, string> };
}

/** Dados do compromisso lidos de um evento do Google. */
export interface DadosDoEvento {
  titulo: string;
  data: string;
  hora: string | null;
  local: string | null;
  descricao: string | null;
  tipo: TipoCompromisso | null; // null = não veio do sistema (será "outro")
  concluido: boolean;
  compromissoId: number | null;
}

const RODAPE = 'Criado pelo sistema Thamara Santana Advocacia.';

/** Soma minutos a data + hora "locais" (sem fuso), voltando data e hora. */
export function somarMinutos(data: string, hora: string, minutos: number): { data: string; hora: string } {
  const [a, m, d] = data.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d, h, min + minutos));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    data: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    hora: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`,
  };
}

/** Evento do Google a partir do compromisso. */
export function eventoDoCompromisso(c: CompromissoParaGoogle): EventoGoogle {
  const prefixo = c.tipo === 'outro' ? '' : `[${ROTULOS[c.tipo]}] `;
  const descricao = [
    c.descricao,
    c.processo_numero ? `Processo ${c.processo_numero}${c.processo_cliente ? ` · ${c.processo_cliente}` : ''}` : null,
    RODAPE,
  ]
    .filter(Boolean)
    .join('\n\n');

  let inicio: EventoGoogle['start'];
  let fim: EventoGoogle['end'];
  if (c.hora) {
    const termino = somarMinutos(c.data, c.hora, 60);
    inicio = { dateTime: `${c.data}T${c.hora}:00`, timeZone: FUSO };
    fim = { dateTime: `${termino.data}T${termino.hora}:00`, timeZone: FUSO };
  } else {
    inicio = { date: c.data };
    fim = { date: somarMinutos(c.data, '00:00', 24 * 60).data };
  }

  return {
    summary: `${c.status === 'concluido' ? '✓ ' : ''}${prefixo}${c.titulo}`,
    location: c.local ?? '',
    description: descricao,
    start: inicio,
    end: fim,
    extendedProperties: { private: { tsId: String(c.id), tsTipo: c.tipo } },
  };
}

/** Data e hora no horário de Brasília a partir de um instante com fuso ("2026-11-05T17:00:00Z"). */
export function dataHoraEmBrasilia(instante: string): { data: string; hora: string } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instante));
  const v = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00';
  return { data: `${v('year')}-${v('month')}-${v('day')}`, hora: `${v('hour')}:${v('minute')}` };
}

/** Lê um evento do Google. Devolve null para eventos sem data (raros) ou cancelados. */
export function dadosDoEvento(ev: EventoGoogle): DadosDoEvento | null {
  if (ev.status === 'cancelled') return null;
  let data: string;
  let hora: string | null = null;
  if (ev.start?.dateTime) {
    ({ data, hora } = dataHoraEmBrasilia(ev.start.dateTime));
  } else if (ev.start?.date) {
    data = ev.start.date;
  } else {
    return null;
  }

  let titulo = (ev.summary ?? '').trim();
  const concluido = titulo.startsWith('✓');
  if (concluido) titulo = titulo.replace(/^✓\s*/, '');
  let tipo: TipoCompromisso | null = null;
  const marcado = titulo.match(/^\[([^\]]+)\]\s*/);
  if (marcado) {
    const achado = (Object.entries(ROTULOS) as [TipoCompromisso, string][]).find(([, r]) => r.toLowerCase() === marcado[1].trim().toLowerCase());
    if (achado) {
      tipo = achado[0];
      titulo = titulo.slice(marcado[0].length);
    }
  }
  const privado = ev.extendedProperties?.private ?? {};
  if (!tipo && privado.tsTipo && privado.tsTipo in ROTULOS) tipo = privado.tsTipo as TipoCompromisso;

  // Tira do texto o que o próprio sistema escreveu (processo e rodapé)
  const descricao =
    (ev.description ?? '')
      .split(/\n\n/)
      .filter((p) => p.trim() !== RODAPE && !/^Processo \d{7}-/.test(p.trim()))
      .join('\n\n')
      .trim() || null;

  const id = Number(privado.tsId);
  return {
    titulo: (titulo || '(sem título)').slice(0, 150),
    data,
    hora,
    local: ev.location?.trim() || null,
    descricao: descricao ? descricao.slice(0, 5000) : null,
    tipo,
    concluido,
    compromissoId: Number.isInteger(id) && id > 0 ? id : null,
  };
}
