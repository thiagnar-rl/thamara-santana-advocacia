import { executar, todos, um } from '../config/database';
import { AREAS_ATUACAO } from '../config/site';
import { resumir } from '../utils/rss';
import { texto } from '../utils/validacao';

/**
 * MODEL — Publicações do escritório (notícias e artigos escritos pela advogada)
 * [F7] Site institucional — solicitado por Thamara Santana (cliente) (04/11/2026).
 *
 * - A advogada escreve pelo sistema (menu "Publicações").
 * - Enquanto for "rascunho", só ela vê. Ao marcar "Publicar no site", aparece na aba Notícias.
 * - Só aparecem no site as publicações das contas autorizadas (ver autoresDoSite()):
 *   assim, se alguém criar uma conta no sistema, não consegue publicar no site do escritório.
 */

export interface Publicacao {
  id: number;
  usuario_id: number;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  area: string | null;
  publicada: number;
  publicado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface DadosPublicacao {
  titulo: string;
  resumo: string | null;
  conteudo: string;
  area: string | null;
  publicada: boolean;
}

export const LIMITE_TITULO = 150;
export const LIMITE_RESUMO = 300;
export const LIMITE_CONTEUDO = 20000;

/** Texto com as quebras de linha preservadas (só tira espaços do começo e do fim). */
function textoLongo(valor: unknown): string | null {
  if (valor === undefined || valor === null) return null;
  const t = String(valor).replace(/\r\n?/g, '\n').trim();
  return t.length ? t : null;
}

/**
 * Contas que podem publicar no site.
 * - Se a variável SITE_AUTORES estiver configurada (e-mails separados por vírgula), são essas.
 * - Se não, é a conta mais antiga do sistema (a da dona do escritório).
 */
export async function autoresDoSite(): Promise<number[]> {
  const emails = (process.env.SITE_AUTORES ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length) {
    const marcadores = emails.map(() => '?').join(', ');
    const linhas = await todos<{ id: number }>(`SELECT id FROM usuarios WHERE lower(email) IN (${marcadores})`, ...emails);
    return linhas.map((l) => Number(l.id));
  }
  const primeira = await um<{ id: number | null }>('SELECT MIN(id) AS id FROM usuarios');
  return primeira?.id ? [Number(primeira.id)] : [];
}

/** Trecho "WHERE" que limita às publicações visíveis no site. */
function filtroSite(autores: number[]): { sql: string; params: (number | string)[] } {
  if (!autores.length) return { sql: '0', params: [] };
  return { sql: `publicada = 1 AND usuario_id IN (${autores.map(() => '?').join(', ')})`, params: autores };
}

export const PublicacaoModel = {
  /** Valida os dados enviados pela tela. */
  validar(corpo: unknown): { dados: DadosPublicacao; erro: null } | { dados: null; erro: string } {
    const c = (corpo ?? {}) as Record<string, unknown>;
    const titulo = texto(c.titulo);
    const resumo = texto(c.resumo);
    const conteudo = textoLongo(c.conteudo);
    const area = texto(c.area);

    if (!titulo || titulo.length < 5) return { dados: null, erro: 'Escreva um título com pelo menos 5 letras.' };
    if (titulo.length > LIMITE_TITULO) return { dados: null, erro: `O título pode ter no máximo ${LIMITE_TITULO} caracteres.` };
    if (resumo && resumo.length > LIMITE_RESUMO) {
      return { dados: null, erro: `O resumo pode ter no máximo ${LIMITE_RESUMO} caracteres.` };
    }
    if (!conteudo || conteudo.length < 20) return { dados: null, erro: 'Escreva o texto da publicação (pelo menos 20 caracteres).' };
    if (conteudo.length > LIMITE_CONTEUDO) {
      return { dados: null, erro: `O texto pode ter no máximo ${LIMITE_CONTEUDO.toLocaleString('pt-BR')} caracteres.` };
    }
    if (area && !AREAS_ATUACAO.some((a) => a.chave === area)) return { dados: null, erro: 'Área de atuação inválida.' };

    return {
      dados: { titulo, resumo, conteudo, area, publicada: c.publicada === true || c.publicada === 1 || c.publicada === 'true' },
      erro: null,
    };
  },

  /** Resumo automático (começo do texto) quando a advogada não escreve um. */
  resumoAutomatico(conteudo: string): string {
    return resumir(conteudo.replace(/\s+/g, ' ').trim(), 220);
  },

  /** Publicações da usuária (rascunhos e publicadas), das mais recentes para as mais antigas. */
  listarDaUsuaria(usuarioId: number): Promise<Publicacao[]> {
    return todos<Publicacao>('SELECT * FROM publicacoes WHERE usuario_id = ? ORDER BY atualizado_em DESC, id DESC', usuarioId);
  },

  buscar(usuarioId: number, id: number): Promise<Publicacao | undefined> {
    return um<Publicacao>('SELECT * FROM publicacoes WHERE id = ? AND usuario_id = ?', id, usuarioId);
  },

  async criar(usuarioId: number, d: DadosPublicacao, agora = new Date()): Promise<number> {
    const quando = agora.toISOString();
    const r = await executar(
      `INSERT INTO publicacoes (usuario_id, titulo, resumo, conteudo, area, publicada, publicado_em, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      usuarioId,
      d.titulo,
      d.resumo,
      d.conteudo,
      d.area,
      d.publicada ? 1 : 0,
      d.publicada ? quando : null,
      quando,
      quando,
    );
    return r.id;
  },

  /** Atualiza. A data de publicação é a da PRIMEIRA vez que foi publicada (não muda a cada correção). */
  async atualizar(usuarioId: number, id: number, d: DadosPublicacao, agora = new Date()): Promise<boolean> {
    const quando = agora.toISOString();
    const r = await executar(
      `UPDATE publicacoes
          SET titulo = ?, resumo = ?, conteudo = ?, area = ?, publicada = ?,
              publicado_em = CASE WHEN ? = 1 THEN COALESCE(publicado_em, ?) ELSE publicado_em END,
              atualizado_em = ?
        WHERE id = ? AND usuario_id = ?`,
      d.titulo,
      d.resumo,
      d.conteudo,
      d.area,
      d.publicada ? 1 : 0,
      d.publicada ? 1 : 0,
      quando,
      quando,
      id,
      usuarioId,
    );
    return r.alteracoes > 0;
  },

  async excluir(usuarioId: number, id: number): Promise<boolean> {
    const r = await executar('DELETE FROM publicacoes WHERE id = ? AND usuario_id = ?', id, usuarioId);
    return r.alteracoes > 0;
  },

  /** Publicações que aparecem no site (só publicadas e de contas autorizadas). */
  async listarNoSite(filtro: { area?: string | null; limite?: number } = {}): Promise<Publicacao[]> {
    const { sql, params } = filtroSite(await autoresDoSite());
    const limite = Math.min(Math.max(filtro.limite ?? 12, 1), 50);
    if (filtro.area) {
      return todos<Publicacao>(
        `SELECT * FROM publicacoes WHERE ${sql} AND area = ? ORDER BY publicado_em DESC, id DESC LIMIT ?`,
        ...params,
        filtro.area,
        limite,
      );
    }
    return todos<Publicacao>(`SELECT * FROM publicacoes WHERE ${sql} ORDER BY publicado_em DESC, id DESC LIMIT ?`, ...params, limite);
  },

  /** Uma publicação do site (ou undefined se não existir, for rascunho ou de conta não autorizada). */
  async buscarNoSite(id: number): Promise<Publicacao | undefined> {
    const { sql, params } = filtroSite(await autoresDoSite());
    return um<Publicacao>(`SELECT * FROM publicacoes WHERE id = ? AND ${sql}`, id, ...params);
  },
};
