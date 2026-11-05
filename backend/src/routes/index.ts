import { Router } from 'express';
import { exigirLogin } from '../middlewares/auth.middleware';
import authRoutes from './auth.routes';
import clientesRoutes from './clientes.routes';
import compromissosRoutes from './compromissos.routes';
import dashboardRoutes from './dashboard.routes';
import processosRoutes from './processos.routes';
import googleRoutes from './google.routes';
import anexosRoutes from './anexos.routes';
import { GoogleController } from '../controllers/google.controller';
import publicacoesRoutes from './publicacoes.routes';
import publicoRoutes from './publico.routes';

/** Junta todas as rotas da API sob o prefixo /api. */
const api = Router();

api.get('/saude', (_req, res) => {
  res.json({ ok: true });
});

// Públicas
api.use('/auth', authRoutes);
api.use('/publico', publicoRoutes); // [F7] site institucional
api.get('/google/retorno', GoogleController.retorno); // [F8] volta do login do Google (sem token: o Google redireciona)

// Protegidas por login
api.use('/processos', exigirLogin, processosRoutes);
api.use('/compromissos', exigirLogin, compromissosRoutes);
api.use('/dashboard', exigirLogin, dashboardRoutes);
api.use('/clientes', exigirLogin, clientesRoutes); // [F6]
api.use('/publicacoes', exigirLogin, publicacoesRoutes); // [F7]
api.use('/google', exigirLogin, googleRoutes); // [F8]
api.use('/anexos', exigirLogin, anexosRoutes); // [F1]

export default api;
