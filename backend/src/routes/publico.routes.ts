import { Router } from 'express';
import { SiteController } from '../controllers/site.controller';

/** [F7] Rotas públicas do site institucional (não exigem login — ver routes/index.ts). */
const router = Router();

router.get('/noticias', SiteController.noticias);
router.get('/noticias/fontes', SiteController.fontes);
router.get('/publicacoes/:id', SiteController.publicacao);

export default router;
