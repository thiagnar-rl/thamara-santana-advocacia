import type { Request, Response } from 'express';
import { AgendaGoogleModel } from '../models/agenda-google.model';
import { GoogleModel } from '../models/google.model';
import { enderecoDoSite } from '../utils/email';
import { emailDaConta, googleConfigurado, trocarCodigo, urlDeAutorizacao } from '../utils/google';
import { gerarCodigoDeFinalidade, verificarCodigoDeFinalidade } from '../utils/token';
import { texto } from '../utils/validacao';
import { erroView } from '../views/erro.view';

const FINALIDADE = 'conectar-google';
export const MENSAGEM_NAO_CONFIGURADO =
  'A conexão com o Google ainda não foi configurada no servidor (GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET na Vercel).';

/**
 * CONTROLLER — Conexão com o Google (Google Agenda; anexos no Drive no F1)
 * [F8] Solicitado por Thiago Rinaldi Luna (04/11/2026).
 */
export const GoogleController = {
  /** GET /api/google → situação da conexão */
  async situacao(req: Request, res: Response): Promise<void> {
    res.json(await GoogleModel.situacao(req.usuarioId));
  },

  /** GET /api/google/conectar → { url } da página de autorização do Google */
  async conectar(req: Request, res: Response): Promise<void> {
    if (!googleConfigurado()) {
      res.status(503).json(erroView(MENSAGEM_NAO_CONFIGURADO));
      return;
    }
    res.json({ url: urlDeAutorizacao(gerarCodigoDeFinalidade(req.usuarioId, FINALIDADE)) });
  },

  /**
   * GET /api/google/retorno?code=&state= (pública: é o Google que manda a usuária para cá)
   * Troca o código pelo acesso, guarda cifrado e volta para o sistema.
   */
  async retorno(req: Request, res: Response): Promise<void> {
    const voltar = (situacao: string) => res.redirect(`${enderecoDoSite()}/sistema/inicio?google=${situacao}`);
    const usuarioId = verificarCodigoDeFinalidade(texto(req.query.state) ?? '', FINALIDADE);
    const codigo = texto(req.query.code);
    if (!usuarioId || !codigo || req.query.error) {
      voltar(req.query.error === 'access_denied' ? 'cancelado' : 'erro');
      return;
    }
    try {
      const tokens = await trocarCodigo(codigo);
      if (!tokens.refreshToken) {
        voltar('erro');
        return;
      }
      const email = await emailDaConta(tokens.accessToken);
      await GoogleModel.salvar(usuarioId, email, tokens.refreshToken);
      // Primeira sincronização: manda os compromissos pendentes de hoje em diante para o Google
      await AgendaGoogleModel.tentar(usuarioId, () => AgendaGoogleModel.enviarPendentes(usuarioId));
      voltar('conectado');
    } catch (erro) {
      console.error('[F8] Falha ao conectar o Google:', erro);
      voltar('erro');
    }
  },

  /** DELETE /api/google → desconecta (os eventos que já estão no Google continuam lá) */
  async desconectar(req: Request, res: Response): Promise<void> {
    await GoogleModel.desconectar(req.usuarioId);
    res.status(204).end();
  },

  /** POST /api/google/sincronizar?forcar=1 → traz as mudanças do Google */
  async sincronizar(req: Request, res: Response): Promise<void> {
    try {
      res.json(await AgendaGoogleModel.receber(req.usuarioId, new Date(), req.query.forcar === '1'));
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      await GoogleModel.registrarErro(req.usuarioId, `Falha ao sincronizar com o Google: ${mensagem}`.slice(0, 300));
      res.status(502).json(erroView('Não foi possível falar com o Google agora. Tente de novo em instantes.'));
    }
  },
};
