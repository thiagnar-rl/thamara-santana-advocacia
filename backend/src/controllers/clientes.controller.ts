import type { Request, Response } from 'express';
import { ClienteModel } from '../models/cliente.model';
import { ProcessoModel } from '../models/processo.model';
import { hoje } from '../utils/datas';
import { texto } from '../utils/validacao';
import { aniversariantesView, clienteDetalheView, clientesView, clienteView } from '../views/cliente.view';
import { erroView } from '../views/erro.view';

const NAO_ENCONTRADO = 'Cliente não encontrado.';

/**
 * CONTROLLER — Clientes
 * [F6] Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */
export const ClientesController = {
  /** GET /api/clientes?busca=&tipo= */
  async listar(req: Request, res: Response): Promise<void> {
    const lista = await ClienteModel.listar(req.usuarioId, { busca: texto(req.query.busca), tipo: texto(req.query.tipo) });
    res.json(clientesView(lista, hoje()));
  },

  /** GET /api/clientes/aniversariantes?dias=7 */
  async aniversariantes(req: Request, res: Response): Promise<void> {
    const dias = Math.min(Math.max(Number(req.query.dias) || 7, 0), 60);
    const dataHoje = hoje();
    res.json(aniversariantesView(await ClienteModel.aniversariantes(req.usuarioId, dataHoje, dias), dataHoje));
  },

  /** GET /api/clientes/:id */
  async obter(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const cliente = await ClienteModel.buscar(req.usuarioId, id);
    if (!cliente) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    const dataHoje = hoje();
    const processos = await ProcessoModel.listarDoCliente(req.usuarioId, id, dataHoje);
    res.json(clienteDetalheView(cliente, processos, dataHoje));
  },

  /** POST /api/clientes */
  async criar(req: Request, res: Response): Promise<void> {
    const dataHoje = hoje();
    const { dados, erro } = ClienteModel.validar(req.body, dataHoje);
    if (erro) {
      res.status(400).json(erroView(erro));
      return;
    }
    const repetido = await ClienteModel.documentoRepetido(req.usuarioId, dados);
    if (repetido) {
      res.status(409).json(erroView(repetido));
      return;
    }
    const id = await ClienteModel.criar(req.usuarioId, dados);
    res.status(201).json(clienteView((await ClienteModel.buscar(req.usuarioId, id))!, dataHoje));
  },

  /** PUT /api/clientes/:id */
  async atualizar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const dataHoje = hoje();
    const { dados, erro } = ClienteModel.validar(req.body, dataHoje);
    if (erro) {
      res.status(400).json(erroView(erro));
      return;
    }
    const repetido = await ClienteModel.documentoRepetido(req.usuarioId, dados, id);
    if (repetido) {
      res.status(409).json(erroView(repetido));
      return;
    }
    if (!(await ClienteModel.atualizar(req.usuarioId, id, dados))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.json(clienteView((await ClienteModel.buscar(req.usuarioId, id))!, dataHoje));
  },

  /** DELETE /api/clientes/:id */
  async excluir(req: Request, res: Response): Promise<void> {
    if (!(await ClienteModel.excluir(req.usuarioId, Number(req.params.id)))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.status(204).end();
  },
};
