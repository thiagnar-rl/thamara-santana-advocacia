import type { NextFunction, Request, Response } from 'express';
import { verificarToken } from '../utils/token';
import { erroView } from '../views/erro.view';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuarioId: number;
    }
  }
}

/** Só deixa passar quem enviou um token válido no cabeçalho Authorization. */
export function exigirLogin(req: Request, res: Response, next: NextFunction): void {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
    res.status(401).json(erroView('Você precisa entrar para continuar.'));
    return;
  }

  const usuarioId = verificarToken(cabecalho.slice(7));
  if (!usuarioId) {
    res.status(401).json(erroView('Sua sessão expirou. Entre novamente.'));
    return;
  }

  req.usuarioId = usuarioId;
  next();
}
