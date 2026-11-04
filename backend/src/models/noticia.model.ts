import { executar, todos, um } from '../config/database';
import {
  AREAS_ATUACAO,
  FONTES_NOTICIAS,
  FonteNoticias,
  INTERVALO_COLETA_MINUTOS,
  MAXIMO_NOTICIAS_GUARDADAS,
  TEMPO_LIMITE_FONTE_MS,
} from '../config/site';
import { decodificarBytes, ItemFeed, lerFeed, normalizar } from '../utils/rss';

/**
 * MODEL — Notícias jurídicas automáticas
 * [F7] Site institucional — solicitado por Thiago Rinaldi Luna (04/11/2026).
 *
 * Como funciona:
 * 1. O site pede as notícias. Se a última busca tem mais de 3 horas, o servidor
 *    busca de novo os feeds RSS das fontes (STJ, ConJur...) — no máximo 5 s por fonte.
 * 2. Cada notícia recebe a área de atuação do escritório que combina com ela
 *    (Família, Previdenciário...). As que não combinam com nenhuma área não aparecem no site.
 * 3. Tudo fica guardado no banco: se uma fonte estiver fora do ar, o site continua
 *    mostrando as notícias que já tinha.
 */

export interface NoticiaExterna {
  id: number;
  fonte: string;
  titulo: string;
  link: string;
  resumo: string | null;
  area: string | null;
  publicado_em: string;
  coletado_em: string;
}

/** Resultado de uma fonte na última busca (para conferir se está funcionando). */
export interface SituacaoFonte {
  sigla: string;
  nome: string;
  ok: boolean;
  itens: number;
  erro?: string;
}

/** Função que busca uma URL (é a fetch do Node; nos testes, uma versão falsa). */
export type Buscador = (url: string, opcoes: { signal: AbortSignal; headers: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(nome: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

const CHAVE_ULTIMA_COLETA = 'noticias.ultima_coleta';
const CHAVE_SITUACAO = 'noticias.situacao_fontes';

/** Descobre a área de atuação de uma notícia pelo título e resumo (ou null se nenhuma combinar). */
export function classificarArea(titulo: string, resumo: string | null = null): string | null {
  const texto = normalizar(`${titulo} ${resumo ?? ''}`);
  return AREAS_ATUACAO.find((a) => a.padrao.test(texto))?.chave ?? null;
}

/** Diz se já passou o intervalo desde a última busca. */
export function precisaColetar(ultima: string | null, agora: Date): boolean {
  if (!ultima) return true;
  const quando = new Date(ultima).getTime();
  if (Number.isNaN(quando)) return true;
  return agora.getTime() - quando >= INTERVALO_COLETA_MINUTOS * 60_000;
}

async function lerMetadado(chave: string): Promise<string | null> {
  return (await um<{ valor: string | null }>('SELECT valor FROM site_metadados WHERE chave = ?', chave))?.valor ?? null;
}

async function gravarMetadado(chave: string, valor: string): Promise<void> {
  await executar(
    'INSERT INTO site_metadados (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    chave,
    valor,
  );
}

/** Busca e lê o feed de uma fonte. */
async function buscarFonte(fonte: FonteNoticias, buscador: Buscador): Promise<ItemFeed[]> {
  const resposta = await buscador(fonte.url, {
    signal: AbortSignal.timeout(TEMPO_LIMITE_FONTE_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ThamaraSantanaAdvocacia/1.0; +site institucional)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
    },
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const xml = decodificarBytes(await resposta.arrayBuffer(), resposta.headers.get('content-type'));
  const itens = lerFeed(xml);
  if (!itens.length) throw new Error('O endereço não devolveu um feed RSS/Atom com notícias.');
  return itens;
}

export const NoticiaModel = {
  /** Quando as notícias foram buscadas pela última vez (ISO) — ou null se nunca. */
  ultimaColeta(): Promise<string | null> {
    return lerMetadado(CHAVE_ULTIMA_COLETA);
  },

  /** Situação de cada fonte na última busca. */
  async situacaoFontes(): Promise<SituacaoFonte[]> {
    const bruto = await lerMetadado(CHAVE_SITUACAO);
    try {
      return bruto ? (JSON.parse(bruto) as SituacaoFonte[]) : [];
    } catch {
      return [];
    }
  },

  /** Guarda os itens novos de uma fonte (links repetidos não duplicam). Devolve quantas linhas mudaram. */
  async salvarItens(fonte: string, itens: ItemFeed[], agora: Date, opcoes: { area?: string; maximo?: number } = {}): Promise<number> {
    if (!itens.length) return 0;
    const coletadoEm = agora.toISOString();
    const valores: (string | null)[] = [];
    for (const item of itens.slice(0, opcoes.maximo ?? 80)) {
      // Sem data no feed: usa o momento da busca. Datas no futuro (fuso errado na fonte) também.
      const data = item.data && item.data <= coletadoEm ? item.data : coletadoEm;
      const area = classificarArea(item.titulo, item.resumo) ?? opcoes.area ?? null;
      valores.push(item.fonte || fonte, item.titulo, item.link, item.resumo, area, data, coletadoEm);
    }
    // Um único INSERT com todas as linhas (mais rápido no banco da nuvem).
    // Se a notícia já existe, só corrige a data quando a fonte passou a informar a data real.
    const linhas = Array.from({ length: valores.length / 7 }, () => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const r = await executar(
      `INSERT INTO noticias_externas (fonte, titulo, link, resumo, area, publicado_em, coletado_em)
       VALUES ${linhas}
       ON CONFLICT(link) DO UPDATE SET publicado_em = excluded.publicado_em
       WHERE excluded.publicado_em < excluded.coletado_em AND noticias_externas.publicado_em <> excluded.publicado_em`,
      ...valores,
    );
    return r.alteracoes;
  },

  /**
   * Busca todas as fontes ao mesmo tempo e guarda o resultado.
   * Uma fonte com problema não atrapalha as outras.
   */
  async coletar(buscador: Buscador = fetch as unknown as Buscador, agora = new Date()): Promise<SituacaoFonte[]> {
    // Marca a busca antes de começar: se duas visitas chegarem juntas, só uma busca.
    await gravarMetadado(CHAVE_ULTIMA_COLETA, agora.toISOString());

    const resultados = await Promise.allSettled(FONTES_NOTICIAS.map((f) => buscarFonte(f, buscador)));
    const situacao: SituacaoFonte[] = [];
    for (const [i, resultado] of resultados.entries()) {
      const fonte = FONTES_NOTICIAS[i];
      if (resultado.status === 'fulfilled') {
        await NoticiaModel.salvarItens(fonte.sigla, resultado.value, agora, { area: fonte.area, maximo: fonte.maximo });
        situacao.push({ sigla: fonte.sigla, nome: fonte.nome, ok: true, itens: resultado.value.length });
      } else {
        const motivo = resultado.reason instanceof Error ? resultado.reason.message : String(resultado.reason);
        situacao.push({ sigla: fonte.sigla, nome: fonte.nome, ok: false, itens: 0, erro: motivo.slice(0, 200) });
      }
    }

    // Mantém só as mais recentes
    await executar(
      `DELETE FROM noticias_externas WHERE id NOT IN (
         SELECT id FROM noticias_externas ORDER BY publicado_em DESC, id DESC LIMIT ?
       )`,
      MAXIMO_NOTICIAS_GUARDADAS,
    );
    await gravarMetadado(CHAVE_SITUACAO, JSON.stringify(situacao));
    return situacao;
  },

  /** Busca de novo só se a última busca for antiga. Nunca lança erro (o site não pode cair por causa disso). */
  async atualizarSePreciso(buscador?: Buscador, agora = new Date()): Promise<void> {
    try {
      // Busca de novo se passou o intervalo ou se a lista de fontes mudou (ex.: fonte nova no config/site.ts)
      const fontesMudaram =
        (await NoticiaModel.situacaoFontes()).map((s) => s.sigla).join('|') !== FONTES_NOTICIAS.map((f) => f.sigla).join('|');
      if (fontesMudaram || precisaColetar(await NoticiaModel.ultimaColeta(), agora)) await NoticiaModel.coletar(buscador, agora);
    } catch (erro) {
      console.error('[F7] Falha ao atualizar as notícias:', erro);
    }
  },

  /** Notícias que aparecem no site: só as de alguma área de atuação, das mais novas para as mais antigas. */
  listar(filtro: { area?: string | null; limite?: number } = {}): Promise<NoticiaExterna[]> {
    const limite = Math.min(Math.max(filtro.limite ?? 30, 1), 60);
    if (filtro.area) {
      return todos<NoticiaExterna>(
        'SELECT * FROM noticias_externas WHERE area = ? ORDER BY publicado_em DESC, id DESC LIMIT ?',
        filtro.area,
        limite,
      );
    }
    return todos<NoticiaExterna>(
      'SELECT * FROM noticias_externas WHERE area IS NOT NULL ORDER BY publicado_em DESC, id DESC LIMIT ?',
      limite,
    );
  },
};
