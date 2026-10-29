import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

/** Rota do painel (exige login — ver routes/index.ts). */
const router = Router();

router.get('/', DashboardController.obter);

export default router;
