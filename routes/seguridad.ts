import { Router } from 'express';
import { poolConexion } from '../middleware/pool';
import { validarJWT } from '../middleware/validarJwt';
import { getColumna, getConsultarTabla, getConsultarArbol, getCombo, egecutarListaSql, getEliminar, getOpciones, auditoriaAccesoPantalla, esUnico, getClientes, getReglasClaveString, cambiarClave, changePassword, saveUser, getConsultaGenerica, updateGenerico, resetPassword } from '../controllers/seguridadCtrl';

const router = Router();

router.post("/api/:pool?/seguridad/getColumnas", poolConexion, validarJWT, getColumna);
router.post("/api/:pool?/seguridad/getConsultarTabla", poolConexion, validarJWT, getConsultarTabla);
router.post("/api/:pool?/seguridad/getConsultarArbol", poolConexion, validarJWT, getConsultarArbol);
router.post("/api/:pool?/seguridad/getCombo", poolConexion, validarJWT, getCombo);
router.post("/api/:pool?/seguridad/ejecutarLista", poolConexion, validarJWT, egecutarListaSql);
router.post("/api/:pool?/seguridad/saveUser", poolConexion, validarJWT, saveUser);
router.post("/api/:pool?/seguridad/eliminar", poolConexion, validarJWT, getEliminar);
router.post("/api/:pool?/seguridad/getConsultaGenerica", poolConexion, validarJWT, getConsultaGenerica);
router.post("/api/:pool?/seguridad/updateGenerico", poolConexion, validarJWT, updateGenerico);
router.post("/api/:pool?/seguridad/getOpciones", poolConexion, validarJWT, getOpciones);
router.post("/api/:pool?/seguridad/auditoriaAccesoPantalla", poolConexion, validarJWT, auditoriaAccesoPantalla);
router.post("/api/:pool?/seguridad/esUnico", poolConexion, validarJWT, esUnico);
router.post("/api/:pool?/seguridad/getCliente", poolConexion, validarJWT, getClientes);
router.get("/api/:pool?/seguridad/getReglasClave", poolConexion, validarJWT, getReglasClaveString);
router.post("/api/:pool?/seguridad/cambiarClave", poolConexion,validarJWT, cambiarClave);
router.post("/api/:pool?/seguridad/resetPassword", poolConexion,validarJWT, resetPassword);
router.post("/api/:pool?/seguridad/changePassword", poolConexion, changePassword);

export default router;