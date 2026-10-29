import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { exigirLogin } from '../middlewares/auth.middleware';

/** Rotas de autenticação: só ligam a URL ao Controller. */
const router = Router();

router.post('/registrar', AuthController.registrar);
router.post('/login', AuthController.login);
router.get('/eu', exigirLogin, AuthController.eu);

export default router;
