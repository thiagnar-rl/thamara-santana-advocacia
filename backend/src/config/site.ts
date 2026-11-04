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
}

/**
 * Fontes com feed RSS público (conferidas em 04/11/2026).
 * O CNJ não oferece mais feed e o da Migalhas devolve erro 404 — por isso ficaram de fora.
 */
export const FONTES_NOTICIAS: FonteNoticias[] = [
  { sigla: 'STJ', nome: 'Superior Tribunal de Justiça', url: 'https://res.stj.jus.br/hrestp-c-portalp/RSS.xml' },
  { sigla: 'ConJur', nome: 'Consultor Jurídico', url: 'https://www.conjur.com.br/rss.xml' },
  { sigla: 'Agência Brasil', nome: 'Agência Brasil — Justiça', url: 'https://agenciabrasil.ebc.com.br/rss/justica/feed.xml' },
];

/** As notícias são buscadas de novo quando a última busca tem mais de 3 horas. */
export const INTERVALO_COLETA_MINUTOS = 180;

/** Tempo máximo de espera por cada fonte (se demorar mais, ela é pulada nesta rodada). */
export const TEMPO_LIMITE_FONTE_MS = 5000;

/** Quantas notícias externas ficam guardadas (as mais antigas são apagadas). */
export const MAXIMO_NOTICIAS_GUARDADAS = 300;
