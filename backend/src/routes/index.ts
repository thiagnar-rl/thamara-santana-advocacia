import { Router } from 'express';
import { exigirLogin } from '../middlewares/auth.middleware';
import authRoutes from './auth.routes';
import clientesRoutes from './clientes.routes';
import compromissosRoutes from './compromissos.routes';
import dashboardRoutes from './dashboard.routes';
import processosRoutes from './processos.routes';

/** Junta todas as rotas da API sob o prefixo /api. */
const api = Router();

api.get('/saude', (_req, res) => {
  res.json({ ok: true });
});

// Públicas
api.use('/auth', authRoutes);

// Protegidas por login
api.use('/processos', exigirLogin, processosRoutes);
api.use('/compromissos', exigirLogin, compromissosRoutes);
api.use('/dashboard', exigirLogin, dashboardRoutes);
api.use('/clientes', exigirLogin, clientesRoutes); // [F6]

export default api;
