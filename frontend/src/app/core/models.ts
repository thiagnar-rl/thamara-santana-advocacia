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
  cliente_id: number | null; // [F6] vínculo com o cadastro de clientes
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
  'numero' | 'cliente' | 'cliente_id' | 'parte_contraria' | 'tribunal' | 'area' | 'status' | 'observacoes'
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

/* ---------- [F6] Clientes — solicitado por Thamara Santana (teste de 30/10/2026) ---------- */

export type TipoPessoa = 'fisica' | 'juridica';

export interface Aniversario {
  data: string; // AAAA-MM-DD do próximo aniversário
  dias: number; // 0 = hoje
  idade: number;
}

export interface ClienteForm {
  tipo: TipoPessoa;
  nome: string; // nome completo (PF) ou razão social (PJ)
  // Pessoa física
  nacionalidade: string | null;
  estado_civil: string | null;
  profissao: string | null;
  rg: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  // Pessoa jurídica
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  ramo_atuacao: string | null;
  representante_nome: string | null;
  representante_cpf: string | null;
  representante_cargo: string | null;
  representante_nascimento: string | null;
  // Contato e localização
  cep: string | null;
  logradouro: string | null;
  endereco_numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
}

export interface Cliente extends ClienteForm {
  id: number;
  criado_em: string;
  atualizado_em: string;
  total_processos: number;
  aniversario: Aniversario | null;
}

export interface ClienteDetalhe {
  cliente: Cliente;
  processos: Processo[];
}
