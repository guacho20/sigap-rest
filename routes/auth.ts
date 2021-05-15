import { Router } from "express";
import { getInit, login, tokenrenew, logout } from '../controllers/authCtrl';
import { poolConexion } from '../middleware/pool';
import { validarJWT } from '../middleware/validarJwt';

const router = Router();

router.get('/:pool?/', poolConexion, getInit);
router.post('/api/:pool?/auth/login', poolConexion, login);
router.post('/api/:pool?/auth/logout', poolConexion, logout);
router.get("/api/:pool?/auth/renew",validarJWT, tokenrenew);

export default router;