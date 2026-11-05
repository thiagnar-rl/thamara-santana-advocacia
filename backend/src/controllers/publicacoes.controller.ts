import type { Request, Response } from 'express';
import { autoresDoSite, PublicacaoModel } from '../models/publicacao.model';
import { erroView } from '../views/erro.view';
import { publicacaoView } from '../views/site.view';

const NAO_ENCONTRADA = 'Publicação não encontrada.';

/**
 * CONTROLLER — Publicações (área logada do sistema)
 * [F7] A advogada escreve notícias e artigos que aparecem na aba Notícias do site.
 * Solicitado por: Thamara Santana (cliente) (04/11/2026).
 */
export const PublicacoesController = {
  /** GET /api/publicacoes → { publicacoes, aparece_no_site } */
  async listar(req: Request, res: Response): Promise<void> {
    const [lista, autores] = await Promise.all([PublicacaoModel.listarDaUsuaria(req.usuarioId), autoresDoSite()]);
    res.json({ publicacoes: lista.map(publicacaoView), aparece_no_site: autores.includes(req.usuarioId) });
  },

  /** GET /api/publicacoes/:id */
  async obter(req: Request, res: Response): Promise<void> {
    const p = await PublicacaoModel.buscar(req.usuarioId, Number(req.params.id));
    if (!p) {
      res.status(404).json(erroView(NAO_ENCONTRADA));
      return;
    }
    res.json(publicacaoView(p));
  },

  /** POST /api/publicacoes */
  async criar(req: Request, res: Response): Promise<void> {
    const validacao = PublicacaoModel.validar(req.body);
    if (validacao.erro !== null) {
      res.status(400).json(erroView(validacao.erro));
      return;
    }
    const id = await PublicacaoModel.criar(req.usuarioId, validacao.dados);
    res.status(201).json(publicacaoView((await PublicacaoModel.buscar(req.usuarioId, id))!));
  },

  /** PUT /api/publicacoes/:id */
  async atualizar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const validacao = PublicacaoModel.validar(req.body);
    if (validacao.erro !== null) {
      res.status(400).json(erroView(validacao.erro));
      return;
    }
    if (!(await PublicacaoModel.atualizar(req.usuarioId, id, validacao.dados))) {
      res.status(404).json(erroView(NAO_ENCONTRADA));
      return;
    }
    res.json(publicacaoView((await PublicacaoModel.buscar(req.usuarioId, id))!));
  },

  /** DELETE /api/publicacoes/:id */
  async excluir(req: Request, res: Response): Promise<void> {
    if (!(await PublicacaoModel.excluir(req.usuarioId, Number(req.params.id)))) {
      res.status(404).json(erroView(NAO_ENCONTRADA));
      return;
    }
    res.status(204).end();
  },
};
