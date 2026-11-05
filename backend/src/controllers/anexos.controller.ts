import type { Request, Response } from 'express';
import { AnexoModel, DONOS, ErroAnexo } from '../models/anexo.model';
import { enderecoDoSite } from '../utils/email';
import { ErroGoogle } from '../utils/google';
import { texto, umDe } from '../utils/validacao';
import { anexosView, anexoView } from '../views/anexo.view';
import { erroView } from '../views/erro.view';

/** Endereços que podem mandar arquivos ao Drive: o site publicado e o computador (desenvolvimento). */
function origemPermitida(origem: string | undefined): string {
  if (origem && (origem === enderecoDoSite() || /^http:\/\/localhost(:\d+)?$/.test(origem) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origem))) {
    return origem;
  }
  return enderecoDoSite();
}

async function responderErro(res: Response, erro: unknown): Promise<void> {
  if (erro instanceof ErroAnexo) {
    res.status(erro.status).json(erroView(erro.message));
    return;
  }
  if (erro instanceof ErroGoogle) {
    console.error('[F1] Erro do Google Drive:', erro.status, erro.message);
    res.status(502).json(erroView('Não foi possível falar com o Google Drive agora. Tente de novo em instantes.'));
    return;
  }
  throw erro;
}

/**
 * CONTROLLER — Anexos no Google Drive
 * [F1] Solicitado por Thamara Santana (cliente) (04/11/2026).
 */
export const AnexosController = {
  /** GET /api/anexos?tipo=processo&id=5 */
  async listar(req: Request, res: Response): Promise<void> {
    const tipo = texto(req.query.tipo);
    const id = Number(req.query.id);
    if (!umDe(DONOS, tipo) || !Number.isInteger(id) || id <= 0) {
      res.status(400).json(erroView('Informe o tipo (cliente, processo ou compromisso) e o id.'));
      return;
    }
    res.json(anexosView(await AnexoModel.listar(req.usuarioId, tipo, id)));
  },

  /** POST /api/anexos/envio { tipo, id, nome, tipo_mime, tamanho } → { url } para o navegador mandar o arquivo ao Drive */
  async iniciarEnvio(req: Request, res: Response): Promise<void> {
    const corpo = (req.body ?? {}) as Record<string, unknown>;
    const nome = texto(corpo.nome);
    const tamanho = Number(corpo.tamanho);
    const id = Number(corpo.id);
    if (!umDe(DONOS, corpo.tipo) || !Number.isInteger(id) || id <= 0 || !nome || !Number.isFinite(tamanho) || tamanho < 0) {
      res.status(400).json(erroView('Dados do arquivo inválidos.'));
      return;
    }
    try {
      const url = await AnexoModel.iniciarEnvio(
        req.usuarioId,
        { dono: corpo.tipo, donoId: id, nome: nome.slice(0, 255), tipoMime: texto(corpo.tipo_mime) ?? 'application/octet-stream', tamanho },
        origemPermitida(typeof req.headers.origin === 'string' ? req.headers.origin : undefined),
      );
      res.json({ url });
    } catch (erro) {
      await responderErro(res, erro);
    }
  },

  /** POST /api/anexos { drive_arquivo_id } → registra o arquivo que acabou de chegar ao Drive */
  async registrar(req: Request, res: Response): Promise<void> {
    const driveId = texto((req.body ?? {}).drive_arquivo_id);
    if (!driveId || !/^[\w-]{10,200}$/.test(driveId)) {
      res.status(400).json(erroView('Arquivo inválido.'));
      return;
    }
    try {
      res.status(201).json(anexoView(await AnexoModel.registrar(req.usuarioId, driveId)));
    } catch (erro) {
      await responderErro(res, erro);
    }
  },

  /** DELETE /api/anexos/:id → o arquivo vai para a lixeira do Drive */
  async excluir(req: Request, res: Response): Promise<void> {
    try {
      if (!(await AnexoModel.excluir(req.usuarioId, Number(req.params.id)))) {
        res.status(404).json(erroView('Anexo não encontrado.'));
        return;
      }
      res.status(204).end();
    } catch (erro) {
      await responderErro(res, erro);
    }
  },
};
