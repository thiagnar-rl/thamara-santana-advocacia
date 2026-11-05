/** [F8] "outro" = evento criado direto no Google Agenda (pedido de Thiago Rinaldi Luna, 04/11/2026). */
export type TipoCompromisso = 'audiencia' | 'recurso' | 'manifestacao' | 'despacho' | 'outro';
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

/** [C4] Cliente de um processo (cadastrado ou só o nome). Pedido de Thiago Rinaldi Luna (04/11/2026). */
export interface ClienteDoProcesso {
  nome: string;
  cliente_id: number | null;
}

export interface Processo {
  id: number;
  numero: string;
  cliente: string; // [C4] resumo com todos os nomes ("Maria; João e mais 2")
  cliente_id: number | null; // [F6] vínculo com o cadastro de clientes
  clientes: ClienteDoProcesso[]; // [C4] todos os clientes do processo
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

/** [C4] O formulário envia a lista de clientes (o resumo "cliente" é montado pelo servidor). */
export type ProcessoForm = Pick<Processo, 'numero' | 'parte_contraria' | 'tribunal' | 'area' | 'status' | 'observacoes'> & {
  clientes: ClienteDoProcesso[];
};

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
  no_google?: boolean; // [F8] ligado a um evento do Google Agenda
}

export type CompromissoForm = Omit<
  Compromisso,
  'id' | 'concluido_em' | 'processo_numero' | 'processo_cliente' | 'no_google'
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

/* ---------- [F7] Site institucional (pedido de Thiago Rinaldi Luna, 04/11/2026) ---------- */

export interface AreaSite {
  chave: string;
  nome: string;
}

/** Publicação escrita pela advogada (tela "Publicações" do sistema). */
export interface PublicacaoForm {
  titulo: string;
  resumo: string | null;
  conteudo: string;
  area: string | null;
  publicada: boolean;
}

export interface Publicacao extends PublicacaoForm {
  id: number;
  area_nome: string | null;
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ListaPublicacoes {
  publicacoes: Publicacao[];
  /** false = esta conta não está autorizada a publicar no site (o texto fica só no sistema). */
  aparece_no_site: boolean;
}

/** Cartão de publicação no site. */
export interface PublicacaoCartao {
  id: number;
  titulo: string;
  resumo: string;
  area: string | null;
  area_nome: string | null;
  publicado_em: string | null;
}

export interface PublicacaoSite extends PublicacaoCartao {
  conteudo: string;
  atualizado_em: string;
}

/** Notícia jurídica buscada automaticamente (STJ, ConJur...). */
export interface NoticiaExterna {
  id: number;
  fonte: string;
  titulo: string;
  link: string;
  resumo: string | null;
  area: string | null;
  area_nome: string | null;
  publicado_em: string;
}

export interface NoticiasSite {
  publicacoes: PublicacaoCartao[];
  noticias: NoticiaExterna[];
  atualizado_em: string | null;
  areas: AreaSite[];
}

/* ---------- [F8] Google Agenda (pedido de Thiago Rinaldi Luna, 04/11/2026) ---------- */

export interface SituacaoGoogle {
  configurado: boolean;
  conectado: boolean;
  email: string | null;
  ultima_sincronizacao: string | null;
  erro: string | null;
}

export interface ResultadoSincronizacao {
  conectado: boolean;
  feita: boolean;
  novos: number;
  atualizados: number;
  removidos: number;
  erro?: string;
}
