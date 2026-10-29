import type { NextFunction, Request, Response } from 'express';
import { erroView } from '../views/erro.view';

/** Rota inexistente. */
export function rotaNaoEncontrada(_req: Request, res: Response): void {
  res.status(404).json(erroView('Rota não encontrada.'));
}

/** Qualquer erro não tratado vira 500 com mensagem amigável. */
export function erroInesperado(erro: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error(erro);
  res.status(500).json(erroView('Ocorreu um erro inesperado no servidor.'));
}
