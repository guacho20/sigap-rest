import { Router } from 'express';
import { poolConexion } from '../middleware/pool';
import { validarJWT } from '../middleware/validarJwt';
import { getColumna, getConsultarTabla, getConsultarArbol, getCombo, egecutarListaSql, getEliminar } from '../controllers/seguridadCtrl';

const router = Router();

router.post("/api/:pool?/seguridad/getColumnas", poolConexion, validarJWT, getColumna);
router.post("/api/:pool?/seguridad/getConsultarTabla", poolConexion, validarJWT, getConsultarTabla);
router.post("/api/:pool?/seguridad/getConsultarArbol", poolConexion, validarJWT, getConsultarArbol);
router.post("/api/:pool?/seguridad/getCombo", poolConexion, validarJWT, getCombo);
router.post("/api/:pool?/seguridad/ejecutarLista", poolConexion, validarJWT, egecutarListaSql);
router.post("/api/:pool?/seguridad/eliminar", poolConexion, validarJWT, getEliminar);
/*router.post("/api/:pool?/seguridad/cambiarClave", poolConexion,validarJWT, cambiarClave);*/

export default router;