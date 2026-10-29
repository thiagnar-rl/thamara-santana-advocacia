import { Router } from 'express';
import { ProcessosController } from '../controllers/processos.controller';

/** Rotas de processos (todas exigem login — ver routes/index.ts). */
const router = Router();

router.get('/', ProcessosController.listar);
router.get('/:id', ProcessosController.obter);
router.post('/', ProcessosController.criar);
router.put('/:id', ProcessosController.atualizar);
router.delete('/:id', ProcessosController.excluir);

export default router;
