import { Router } from 'express';
import { ClientesController } from '../controllers/clientes.controller';

/** [F6] Rotas de clientes (todas exigem login — ver routes/index.ts). */
const router = Router();

router.get('/', ClientesController.listar);
router.get('/aniversariantes', ClientesController.aniversariantes); // antes de "/:id"
router.get('/:id', ClientesController.obter);
router.post('/', ClientesController.criar);
router.put('/:id', ClientesController.atualizar);
router.delete('/:id', ClientesController.excluir);

export default router;
