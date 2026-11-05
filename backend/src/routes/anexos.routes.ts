import { Router } from 'express';
import { AnexosController } from '../controllers/anexos.controller';

/** [F1] Anexos no Google Drive (todas exigem login). */
const router = Router();

router.get('/', AnexosController.listar);
router.post('/envio', AnexosController.iniciarEnvio);
router.post('/', AnexosController.registrar);
router.delete('/:id', AnexosController.excluir);

export default router;
