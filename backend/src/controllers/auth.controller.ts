import type { Request, Response } from 'express';
import { UsuarioModel } from '../models/usuario.model';
import { gerarToken } from '../utils/token';
import { texto } from '../utils/validacao';
import { erroView } from '../views/erro.view';
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
