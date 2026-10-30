import type { Request, Response } from 'express';
import { CompromissoModel } from '../models/compromisso.model';
import { ClienteModel } from '../models/cliente.model';
import { DadosProcesso, ProcessoModel } from '../models/processo.model';
import { hoje } from '../utils/datas';
import { texto } from '../utils/validacao';
import { erroView } from '../views/erro.view';
import { processoDetalheView, processosView, processoView } from '../views/processo.view';

const NAO_ENCONTRADO = 'Processo não encontrado.';
const NUMERO_REPETIDO = 'Já existe um processo cadastrado com este número.';

/**
 * [F6] Se o processo foi ligado a um cliente cadastrado, confere se o cliente é da usuária
 * e usa o nome do cadastro (assim o nome fica igual nas duas telas). Devolve erro ou null.
 * Solicitado por: Thamara Santana (teste de 30/10/2026).
 */
async function vincularCliente(usuarioId: number, dados: DadosProcesso): Promise<string | null> {
  if (!dados.cliente_id) return null;
  const cliente = await ClienteModel.buscar(usuarioId, dados.cliente_id);
  if (!cliente) return 'Cliente não encontrado.';
  dados.cliente = cliente.nome;
  return null;
}

/** CONTROLLER — Processos */
export const ProcessosController = {
  /** GET /api/processos?busca=&status= */
  async listar(req: Request, res: Response): Promise<void> {
    const lista = await ProcessoModel.listar(
      req.usuarioId,
      { busca: texto(req.query.busca), status: texto(req.query.status) },
      hoje(),
    );
    res.json(processosView(lista));
  },

  /** GET /api/processos/:id */
  async obter(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const processo = await ProcessoModel.buscar(req.usuarioId, id, hoje());
    if (!processo) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    const compromissos = await CompromissoModel.listarDoProcesso(req.usuarioId, id);
    res.json(processoDetalheView(processo, compromissos));
  },

  /** POST /api/processos */
  async criar(req: Request, res: Response): Promise<void> {
    const { dados, erro } = ProcessoModel.validar(req.body);
    const erroFinal = erro ?? (await vincularCliente(req.usuarioId, dados));
    if (erroFinal) {
      res.status(400).json(erroView(erroFinal));
      return;
    }
    if (await ProcessoModel.numeroRepetido(req.usuarioId, dados.numero)) {
      res.status(409).json(erroView(NUMERO_REPETIDO));
      return;
    }
    const id = await ProcessoModel.criar(req.usuarioId, dados);
    res.status(201).json(processoView((await ProcessoModel.buscar(req.usuarioId, id, hoje()))!));
  },

  /** PUT /api/processos/:id */
  async atualizar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id);
    const { dados, erro } = ProcessoModel.validar(req.body);
    const erroFinal = erro ?? (await vincularCliente(req.usuarioId, dados));
    if (erroFinal) {
      res.status(400).json(erroView(erroFinal));
      return;
    }
    if (await ProcessoModel.numeroRepetido(req.usuarioId, dados.numero, id)) {
      res.status(409).json(erroView(NUMERO_REPETIDO));
      return;
    }
    if (!(await ProcessoModel.atualizar(req.usuarioId, id, dados))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.json(processoView((await ProcessoModel.buscar(req.usuarioId, id, hoje()))!));
  },

  /** DELETE /api/processos/:id */
  async excluir(req: Request, res: Response): Promise<void> {
    if (!(await ProcessoModel.excluir(req.usuarioId, Number(req.params.id)))) {
      res.status(404).json(erroView(NAO_ENCONTRADO));
      return;
    }
    res.status(204).end();
  },
};
