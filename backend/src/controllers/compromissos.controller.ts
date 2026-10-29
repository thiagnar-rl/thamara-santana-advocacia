import type { Request, Response } from 'express';
import { CompromissoModel } from '../models/compromisso.model';
import { hoje } from '../utils/datas';
import { STATUS_COMPROMISSO, texto, umDe } from '../utils/validacao';
import { compromissosView, compromissoView } from '../views/compromisso.view';
import { erroView } from '../views/erro.view';

const NAO_ENCONTRADO = 'Compromisso não encontrado.';

/** CONTROLLER — Compromissos (audiências, recursos, manifestações, despachos) */
export const CompromissosController = {
  /** GET /api/compromissos?tipo=&status=&de=&ate=&processoId=&periodo= */
  async listar(req: Request, res: Response): Promise<void> {
    const q = req.query;
    const lista = await CompromissoModel.listar(
      req.usuarioId,
      {
        tipo: texto(q.tipo),
        status: texto(q.status),
        de: texto(q.de),
        ate: texto(q.ate),
        processoId: texto(q.processoId),
        periodo: texto(q.periodo),
      },
      hoje(),
    );
    res.json(compromissosView(lista));
  },

  /** POST /api/compromissos */
  async criar(req: Request, res: Response): Promise<void> {
    const { dados, erro } = await CompromissoModel.validar(req.body, req.usuarioId);
    if (erro) {
      res.status(400).json(erroView(erro));
      return;
    }
    const id = await CompromissoModel.criar(req.usuarioId, dados);
    res.status(201).json(compromissoView((await CompromissoModel.buscar(req.usuarioId, id))!));
  },

  /** PUT /api/compromissos/:id */
  async atualizar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const { dados, erro } = await CompromissoModel.validar(req.body, req.usuarioId);
    if (erro) {
      res.status(400).json(erroView(erro));
      return;
    }
    if (!(await CompromissoModel.atualizar(req.usuarioId, id, dados))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.json(compromissoView((await CompromissoModel.buscar(req.usuarioId, id))!));
  },

  /** PATCH /api/compromissos/:id/status */
  async alterarStatus(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const status = texto(req.body?.status);
    if (!umDe(STATUS_COMPROMISSO, status)) {
      res.status(400).json(erroView('Status inválido.'));
      return;
    }
    if (!(await CompromissoModel.alterarStatus(req.usuarioId, id, status))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.json(compromissoView((await CompromissoModel.buscar(req.usuarioId, id))!));
  },

  /** DELETE /api/compromissos/:id */
  async excluir(req: Request, res: Response): Promise<void> {
    if (!(await CompromissoModel.excluir(req.usuarioId, Number(req.params.id)))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.status(204).end();
  },
};
