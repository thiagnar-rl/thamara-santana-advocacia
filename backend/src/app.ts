import express from 'express';
import cors from 'cors';
import { erroInesperado, rotaNaoEncontrada } from './middlewares/erros.middleware';
import api from './routes';

/**
 * Monta a aplicação Express (sem iniciar o servidor).
 * Fica separada do server.ts para facilitar testes.
 */
export function criarApp() {
  const app = express();

  app.use(cors({ origin: ['http://localhost:4200'] }));
  app.use(express.json());

  app.use('/api', api);

  app.use(rotaNaoEncontrada);
  app.use(erroInesperado);

  return app;
}
