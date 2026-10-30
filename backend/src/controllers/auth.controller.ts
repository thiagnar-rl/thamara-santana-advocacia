import type { Request, Response } from 'express';
import { RecuperacaoModel } from '../models/recuperacao.model';
import { UsuarioModel } from '../models/usuario.model';
import { EmailNaoConfigurado, emailConfigurado, enderecoDoSite, enviarEmail } from '../utils/email';
import { gerarToken } from '../utils/token';
import { emailValido, texto } from '../utils/validacao';
import { erroView } from '../views/erro.view';
import {
  MENSAGEM_EMAIL_NAO_CONFIGURADO,
  MENSAGEM_LINK_INVALIDO,
  MENSAGEM_PEDIDO_RECEBIDO,
  emailRecuperacaoView,
} from '../views/recuperacao.view';
import { sessaoView, usuarioView } from '../views/usuario.view';

/**
 * CONTROLLER — Autenticação
 * Recebe a requisição, aciona o Model e devolve a View (JSON).
 */
export const AuthController = {
  /** POST /api/auth/registrar */
  async registrar(req: Request, res: Response): Promise<void> {
    // Na internet, o cadastro pode ser fechado depois de criar a conta da advogada.
    if (process.env.PERMITIR_CADASTRO === 'false') {
      res.status(403).json(erroView('O cadastro de novas contas está desativado.'));
      return;
    }
    const { dados, erro } = UsuarioModel.validarCadastro(req.body);
    if (erro) {
      res.status(400).json(erroView(erro));
      return;
    }
    if (await UsuarioModel.emailEmUso(dados.email)) {
      res.status(409).json(erroView('Já existe uma conta com este e-mail.'));
      return;
    }

    const id = await UsuarioModel.criar(dados);
    res.status(201).json(sessaoView(gerarToken(id), { id, nome: dados.nome, email: dados.email }));
  },

  /** POST /api/auth/login */
  async login(req: Request, res: Response): Promise<void> {
    const email = texto(req.body?.email) ?? '';
    const senha = String(req.body?.senha ?? '');

    const usuario = await UsuarioModel.autenticar(email, senha);
    if (!usuario) {
      res.status(401).json(erroView('E-mail ou senha incorretos.'));
      return;
    }
    res.json(sessaoView(gerarToken(usuario.id), usuario));
  },

  /**
   * POST /api/auth/esqueci-senha  { email }
   * [F3] Envia o link de recuperação. A resposta é a mesma exista ou não a conta.
   * Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
   */
  async esqueciSenha(req: Request, res: Response): Promise<void> {
    const email = (texto(req.body?.email) ?? '').toLowerCase();
    if (!emailValido(email)) {
      res.status(400).json(erroView('Informe um e-mail válido.'));
      return;
    }
    if (process.env.VERCEL && !emailConfigurado()) {
      res.status(503).json(erroView(MENSAGEM_EMAIL_NAO_CONFIGURADO));
      return;
    }

    const usuario = await UsuarioModel.buscarPorEmail(email);
    if (usuario) {
      const token = await RecuperacaoModel.criar(usuario);
      if (token) {
        const link = `${enderecoDoSite()}/redefinir-senha?token=${encodeURIComponent(token)}`;
        try {
          await enviarEmail(emailRecuperacaoView(usuario.nome, usuario.email, link));
        } catch (erro) {
          console.error('[F3] Falha ao enviar o e-mail de recuperação:', erro);
          const msg = erro instanceof EmailNaoConfigurado ? MENSAGEM_EMAIL_NAO_CONFIGURADO
            : 'Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.';
          res.status(503).json(erroView(msg));
          return;
        }
      }
    }
    res.json({ mensagem: MENSAGEM_PEDIDO_RECEBIDO });
  },

  /**
   * POST /api/auth/redefinir-senha  { token, senha }
   * [F3] Troca a senha pelo link do e-mail e já entra no sistema.
   */
  async redefinirSenha(req: Request, res: Response): Promise<void> {
    const token = String(req.body?.token ?? '');
    const senha = String(req.body?.senha ?? '');
    const erroSenha = RecuperacaoModel.validarSenha(senha);
    if (erroSenha) {
      res.status(400).json(erroView(erroSenha));
      return;
    }
    const usuarioId = await RecuperacaoModel.redefinir(token, senha);
    const usuario = usuarioId ? await UsuarioModel.buscarPorId(usuarioId) : undefined;
    if (!usuario) {
      res.status(400).json(erroView(MENSAGEM_LINK_INVALIDO));
      return;
    }
    res.json(sessaoView(gerarToken(usuario.id), usuario));
  },

  /** GET /api/auth/eu */
  async eu(req: Request, res: Response): Promise<void> {
    const usuario = await UsuarioModel.buscarPorId(req.usuarioId);
    if (!usuario) {
      res.status(404).json(erroView('Usuário não encontrado.'));
      return;
    }
    res.json(usuarioView(usuario));
  },
};
