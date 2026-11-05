import { Router } from 'express';
import { GoogleController } from '../controllers/google.controller';

/** [F8] Rotas da conexão com o Google (todas exigem login — a de retorno fica em routes/index.ts). */
const router = Router();

router.get('/', GoogleController.situacao);
router.get('/conectar', GoogleController.conectar);
router.post('/sincronizar', GoogleController.sincronizar);
router.delete('/', GoogleController.desconectar);

export default router;
