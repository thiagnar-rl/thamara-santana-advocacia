/**
 * CONFIGURAÇÃO DO SITE INSTITUCIONAL
 * [F7] Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 *
 * Aqui ficam, num lugar só:
 * - as áreas de atuação do escritório (e as palavras que identificam cada uma numa notícia);
 * - as fontes de onde as notícias jurídicas são buscadas automaticamente;
 * - de quanto em quanto tempo as notícias são atualizadas.
 *
 * Para trocar uma fonte, basta editar a lista FONTES_NOTICIAS.
 */

export interface AreaAtuacao {
  chave: string;
  nome: string;
  /**
   * Expressão que identifica a área numa notícia. O texto da notícia é comparado
   * sem acentos e em minúsculas; \b marca o começo/fim de uma palavra.
   */
  padrao: RegExp;
}

/** A ordem importa: a primeira área que combinar com a notícia é a escolhida. */
export const AREAS_ATUACAO: AreaAtuacao[] = [
  {
    chave: 'familia',
    nome: 'Família, Patrimônio e Sucessões',
    padrao:
      /\b(familia|familiar|divorci|guarda (compartilhada|unilateral|do filho|dos filhos)|pensao alimenticia|alimentos\b|heranca|herdeir|inventario|testament|sucessao|sucessoes|sucessori|partilha|uniao estavel|casamento|adocao|paternidade|holding|doacao|curatela|regime de bens|planejamento (patrimonial|sucessorio)|alienacao parental|espolio)/,
  },
  {
    chave: 'previdenciario',
    nome: 'Previdenciário',
    padrao:
      /\b(inss|aposentad|previdenc|bpc\b|loas\b|auxilio[- ](doenca|acidente|por incapacidade)|pensao por morte|salario[- ]maternidade|beneficio assistencial)/,
  },
  {
    chave: 'trabalhista',
    nome: 'Trabalhista',
    padrao:
      /\b(trabalhista|trabalhador|clt\b|empregad[oa]s?\b|empregador|rescis|fgts\b|justa causa|horas extras|vinculo empregaticio|assedio moral|acidente de trabalho|tst\b)/,
  },
  {
    chave: 'consumidor',
    nome: 'Consumidor',
    padrao:
      /\b(consumidor|cdc\b|procon|plano de saude|planos de saude|cobranca indevida|negativacao|negativad|companhia aerea|voo (cancelado|atrasado)|atraso de voo|compra online|propaganda enganosa)/,
  },
  {
    chave: 'criminal',
    nome: 'Criminal',
    padrao:
      /\b(penal\b|penais\b|crime|criminal|criminais|prisao|pres[oa]s?\b|habeas corpus|reus?\b|tribunal do juri|trafico|homicid|feminicid|furto|roubo|estelionato|violencia domestica|maria da penha)/,
  },
];

export interface FonteNoticias {
  sigla: string;
  nome: string;
  url: string;
  /** Área usada quando o texto da notícia não indica nenhuma (buscas já feitas por área). */
  area?: string;
  /** Quantos itens aproveitar desta fonte em cada busca. */
  maximo?: number;
}

/** Sites jurídicos e oficiais de confiança usados nas buscas do Google Notícias. */
const SITES_CONFIAVEIS = [
  'stj.jus.br', 'stf.jus.br', 'tst.jus.br', 'cnj.jus.br', 'conjur.com.br', 'migalhas.com.br',
  'ibdfam.org.br', 'jota.info', 'agenciabrasil.ebc.com.br', 'gov.br',
].map((s) => `site:${s}`).join(' OR ');

/** Busca no Google Notícias (últimos 3 dias), só nos sites de confiança acima. */
function buscaGoogleNoticias(termos: string): string {
  const consulta = `${termos} (${SITES_CONFIAVEIS}) when:3d`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

/**
 * Fontes das notícias (conferidas em 04/11/2026).
 * - Feeds diretos: STJ, ConJur e Agência Brasil. (O CNJ não oferece mais feed e o da Migalhas dá erro 404.)
 * - O site do STJ às vezes não responde aos servidores da Vercel (que ficam fora do Brasil). Por isso há
 *   também buscas por área no Google Notícias, limitadas a sites jurídicos e oficiais de confiança
 *   (STJ, STF, TST, ConJur, Migalhas, IBDFAM...). Nelas, o nome mostrado é o do site de origem.
 */
export const FONTES_NOTICIAS: FonteNoticias[] = [
  { sigla: 'STJ', nome: 'Superior Tribunal de Justiça', url: 'https://res.stj.jus.br/hrestp-c-portalp/RSS.xml' },
  { sigla: 'ConJur', nome: 'Consultor Jurídico', url: 'https://www.conjur.com.br/rss.xml' },
  { sigla: 'Agência Brasil', nome: 'Agência Brasil — Justiça', url: 'https://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
  {
    sigla: 'Busca: Família',
    nome: 'Google Notícias — Família, Patrimônio e Sucessões',
    url: buscaGoogleNoticias('("direito de família" OR inventário OR herança OR divórcio OR "pensão alimentícia" OR "união estável" OR testamento)'),
    area: 'familia',
    maximo: 20,
  },
  {
    sigla: 'Busca: Previdenciário',
    nome: 'Google Notícias — Previdenciário',
    url: buscaGoogleNoticias('(INSS OR aposentadoria OR "benefício previdenciário" OR BPC)'),
    area: 'previdenciario',
    maximo: 15,
  },
  {
    sigla: 'Busca: Trabalhista',
    nome: 'Google Notícias — Trabalhista',
    url: buscaGoogleNoticias('(TST OR "Justiça do Trabalho" OR trabalhista OR trabalhador)'),
    area: 'trabalhista',
    maximo: 15,
  },
  {
    sigla: 'Busca: Consumidor',
    nome: 'Google Notícias — Consumidor',
    url: buscaGoogleNoticias('("direito do consumidor" OR consumidor OR "plano de saúde" OR "companhia aérea")'),
    area: 'consumidor',
    maximo: 15,
  },
  {
    sigla: 'Busca: Criminal',
    nome: 'Google Notícias — Criminal',
    url: buscaGoogleNoticias('("habeas corpus" OR criminal OR "direito penal" OR "processo penal")'),
    area: 'criminal',
    maximo: 15,
  },
];

/** As notícias são buscadas de novo quando a última busca tem mais de 3 horas. */
export const INTERVALO_COLETA_MINUTOS = 180;

/** Tempo máximo de espera por cada fonte (se demorar mais, ela é pulada nesta rodada). */
export const TEMPO_LIMITE_FONTE_MS = 5000;

/** Quantas notícias externas ficam guardadas (as mais antigas são apagadas). */
export const MAXIMO_NOTICIAS_GUARDADAS = 400;
