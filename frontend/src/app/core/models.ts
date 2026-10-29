export type TipoCompromisso = 'audiencia' | 'recurso' | 'manifestacao' | 'despacho';
export type StatusCompromisso = 'pendente' | 'concluido';
export type Prioridade = 'baixa' | 'media' | 'alta';
export type StatusProcesso = 'ativo' | 'suspenso' | 'arquivado' | 'encerrado';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

export interface Processo {
  id: number;
  numero: string;
  cliente: string;
  parte_contraria: string | null;
  tribunal: string | null;
  area: string | null;
  status: StatusProcesso;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  total_pendentes: number;
  proximo_compromisso: string | null;
}

export type ProcessoForm = Pick<
  Processo,
  'numero' | 'cliente' | 'parte_contraria' | 'tribunal' | 'area' | 'status' | 'observacoes'
>;

export interface Compromisso {
  id: number;
  processo_id: number | null;
  tipo: TipoCompromisso;
  titulo: string;
  data: string; // AAAA-MM-DD
  hora: string | null; // HH:MM
  local: string | null;
  descricao: string | null;
  prioridade: Prioridade;
  status: StatusCompromisso;
  concluido_em?: string | null;
  processo_numero?: string | null;
  processo_cliente?: string | null;
}

export type CompromissoForm = Omit<
  Compromisso,
  'id' | 'concluido_em' | 'processo_numero' | 'processo_cliente'
>;

export interface ProcessoDetalhe {
  processo: Processo;
  compromissos: Compromisso[];
}

export interface Dashboard {
  resumo: {
    processosAtivos: number;
    hoje: number;
    semana: number;
    atrasados: number;
    concluidosMes: number;
  };
  hoje: Compromisso[];
  proximos: Compromisso[];
  atrasados: Compromisso[];
  porTipo: Record<TipoCompromisso, number>;
}

export interface FiltroCompromissos {
  tipo?: TipoCompromisso | null;
  status?: StatusCompromisso | null;
  de?: string | null;
  ate?: string | null;
  processoId?: number | null;
  periodo?: 'atrasados' | null;
}
