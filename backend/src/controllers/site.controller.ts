import type { Request, Response } from 'express';
import { AREAS_ATUACAO } from '../config/site';
import { NoticiaModel } from '../models/noticia.model';
import { PublicacaoModel } from '../models/publicacao.model';
import { texto } from '../utils/validacao';
import { erroView } from '../views/erro.view';
import { fontesView, noticiasSiteView, publicacaoSiteView } from '../views/site.view';

/**
 * CONTROLLER — Site institucional (rotas PÚBLICAS, sem login)
 * [F7] Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 */

/** Só aceita áreas que existem (qualquer outro valor vira "todas"). */
function areaDoFiltro(valor: unknown): string | null {
  const area = texto(valor);
  return area && AREAS_ATUACAO.some((a) => a.chave === area) ? area : null;
}

/** As respostas públicas podem ficar 5 minutos em cache no navegador e na Vercel. */
function cachePublico(res: Response): void {
  if (typeof res.set === 'function') res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
}

export const SiteController = {
  /** GET /api/publico/noticias?area=familia&limite=30 */
  async noticias(req: Request, res: Response): Promise<void> {
    await NoticiaModel.atualizarSePreciso();
    const area = areaDoFiltro(req.query.area);
    const limite = Number(req.query.limite) || undefined;
    const [publicacoes, noticias, atualizadoEm] = await Promise.all([
      PublicacaoModel.listarNoSite({ area, limite: limite ? Math.min(limite, 12) : 12 }),
      NoticiaModel.listar({ area, limite }),
      NoticiaModel.ultimaColeta(),
    ]);
    cachePublico(res);
    res.json(noticiasSiteView(publicacoes, noticias, atualizadoEm));
  },

  /** GET /api/publico/publicacoes/:id */
  async publicacao(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const p = Number.isInteger(id) && id > 0 ? await PublicacaoModel.buscarNoSite(id) : undefined;
    if (!p) {
      res.status(404).json(erroView('Publicação não encontrada.'));
      return;
    }
    cachePublico(res);
    res.json(publicacaoSiteView(p));
  },

  /** GET /api/publico/noticias/fontes — mostra se cada fonte respondeu na última busca. */
  async fontes(_req: Request, res: Response): Promise<void> {
    const [situacao, atualizadoEm] = await Promise.all([NoticiaModel.situacaoFontes(), NoticiaModel.ultimaColeta()]);
    res.json(fontesView(situacao, atualizadoEm));
  },
};
