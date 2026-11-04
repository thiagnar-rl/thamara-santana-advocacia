import { AREAS_ATUACAO } from '../config/site';
import { NoticiaExterna, SituacaoFonte } from '../models/noticia.model';
import { Publicacao, PublicacaoModel } from '../models/publicacao.model';

/**
 * VIEW — Site institucional (publicações do escritório e notícias automáticas)
 * [F7] Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 * Nunca envia usuario_id para o site público.
 */

/** Nome da área por extenso (ex.: "familia" → "Família, Patrimônio e Sucessões"). */
export function nomeDaArea(chave: string | null): string | null {
  return AREAS_ATUACAO.find((a) => a.chave === chave)?.nome ?? null;
}

/** Publicação no formato usado pelo sistema (tela "Publicações"). */
export function publicacaoView(p: Publicacao) {
  return {
    id: Number(p.id),
    titulo: p.titulo,
    resumo: p.resumo,
    conteudo: p.conteudo,
    area: p.area,
    area_nome: nomeDaArea(p.area),
    publicada: Number(p.publicada) === 1,
    publicado_em: p.publicado_em,
    criado_em: p.criado_em,
    atualizado_em: p.atualizado_em,
  };
}

/** Cartão de publicação no site (sem o texto completo). */
export function publicacaoCartaoView(p: Publicacao) {
  return {
    id: Number(p.id),
    titulo: p.titulo,
    resumo: p.resumo || PublicacaoModel.resumoAutomatico(p.conteudo),
    area: p.area,
    area_nome: nomeDaArea(p.area),
    publicado_em: p.publicado_em,
  };
}

/** Publicação completa no site. */
export function publicacaoSiteView(p: Publicacao) {
  return { ...publicacaoCartaoView(p), conteudo: p.conteudo, atualizado_em: p.atualizado_em };
}

export function noticiaView(n: NoticiaExterna) {
  return {
    id: Number(n.id),
    fonte: n.fonte,
    titulo: n.titulo,
    link: n.link,
    resumo: n.resumo,
    area: n.area,
    area_nome: nomeDaArea(n.area),
    publicado_em: n.publicado_em,
  };
}

/** Resposta da aba Notícias: publicações do escritório + notícias jurídicas do dia. */
export function noticiasSiteView(publicacoes: Publicacao[], noticias: NoticiaExterna[], atualizadoEm: string | null) {
  return {
    publicacoes: publicacoes.map(publicacaoCartaoView),
    noticias: noticias.map(noticiaView),
    atualizado_em: atualizadoEm,
    areas: AREAS_ATUACAO.map((a) => ({ chave: a.chave, nome: a.nome })),
  };
}

/** Situação das fontes (para conferir se a busca automática está funcionando). */
export function fontesView(situacao: SituacaoFonte[], atualizadoEm: string | null) {
  return { atualizado_em: atualizadoEm, fontes: situacao };
}
