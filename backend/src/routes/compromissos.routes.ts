import { Router } from 'express';
import { CompromissosController } from '../controllers/compromissos.controller';

/** Rotas de compromissos (todas exigem login — ver routes/index.ts). */
const router = Router();

router.get('/', CompromissosController.listar);
router.post('/', CompromissosController.criar);
router.put('/:id', CompromissosController.atualizar);
router.patch('/:id/status', CompromissosController.alterarStatus);
router.delete('/:id', CompromissosController.excluir);

export default router;
