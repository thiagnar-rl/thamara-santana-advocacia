import { Router } from 'express';
import { PublicacoesController } from '../controllers/publicacoes.controller';

/** [F7] Publicações do escritório — todas exigem login (ver routes/index.ts). */
const router = Router();

router.get('/', PublicacoesController.listar);
router.get('/:id', PublicacoesController.obter);
router.post('/', PublicacoesController.criar);
router.put('/:id', PublicacoesController.atualizar);
router.delete('/:id', PublicacoesController.excluir);

export default router;
