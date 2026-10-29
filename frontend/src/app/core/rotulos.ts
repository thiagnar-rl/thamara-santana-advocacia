import { Prioridade, StatusProcesso, TipoCompromisso } from './models';

/** Nomes, ícones e textos exibidos na tela. */

export interface InfoTipo {
  valor: TipoCompromisso;
  rotulo: string;
  plural: string;
  icone: string;
}

export const TIPOS: InfoTipo[] = [
  { valor: 'audiencia', rotulo: 'Audiência', plural: 'Audiências', icone: 'audiencia' },
  { valor: 'recurso', rotulo: 'Recurso', plural: 'Recursos', icone: 'recurso' },
  { valor: 'manifestacao', rotulo: 'Manifestação', plural: 'Manifestações', icone: 'manifestacao' },
  { valor: 'despacho', rotulo: 'Despacho', plural: 'Despachos', icone: 'despacho' },
];

export function infoTipo(tipo: TipoCompromisso): InfoTipo {
  return TIPOS.find((t) => t.valor === tipo) ?? TIPOS[0];
}

export const PRIORIDADES: { valor: Prioridade; rotulo: string }[] = [
  { valor: 'baixa', rotulo: 'Baixa' },
  { valor: 'media', rotulo: 'Média' },
  { valor: 'alta', rotulo: 'Alta' },
];

export const STATUS_PROCESSO: { valor: StatusProcesso; rotulo: string }[] = [
  { valor: 'ativo', rotulo: 'Ativo' },
  { valor: 'suspenso', rotulo: 'Suspenso' },
  { valor: 'arquivado', rotulo: 'Arquivado' },
  { valor: 'encerrado', rotulo: 'Encerrado' },
];

export function rotuloStatusProcesso(status: StatusProcesso): string {
  return STATUS_PROCESSO.find((s) => s.valor === status)?.rotulo ?? status;
}

export const AREAS = [
  'Cível',
  'Trabalhista',
  'Família',
  'Consumidor',
  'Previdenciário',
  'Criminal',
  'Tributário',
  'Empresarial',
  'Administrativo',
];

/* ---------- Datas ---------- */

/** Data no formato AAAA-MM-DD, no fuso do computador. */
export function paraISO(data: Date): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

export function hojeISO(): string {
  return paraISO(new Date());
}

export function deISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function somarDias(iso: string, dias: number): string {
  const data = deISO(iso);
  data.setDate(data.getDate() + dias);
  return paraISO(data);
}

/** Diferença em dias entre hoje e a data (negativo = passado). */
export function diasAte(iso: string): number {
  const ms = deISO(iso).getTime() - deISO(hojeISO()).getTime();
  return Math.round(ms / 86_400_000);
}

/** "Hoje", "Amanhã", "Ontem" ou "qua, 5 de nov." */
export function dataRelativa(iso: string): string {
  const dias = diasAte(iso);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  return deISO(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "5 de novembro de 2026" */
export function dataLonga(iso: string): string {
  return deISO(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** "05/11/2026" */
export function dataCurta(iso: string): string {
  return deISO(iso).toLocaleDateString('pt-BR');
}

/** "quarta-feira" */
export function diaDaSemana(iso: string): string {
  return deISO(iso).toLocaleDateString('pt-BR', { weekday: 'long' });
}

/** Texto amigável de prazo: "em 3 dias", "há 2 dias"... */
export function prazoTexto(iso: string): string {
  const dias = diasAte(iso);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias === -1) return 'ontem';
  return dias > 0 ? `em ${dias} dias` : `há ${Math.abs(dias)} dias`;
}

export function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
