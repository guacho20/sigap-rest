import { Router } from 'express';
import { poolConexion } from './../middleware/pool';
import { getProyecto, getPostMeta, getPostProyectoIndicador } from './../controllers/gerencialpdotCtrl';
import { getDetalleProyecto } from '../controllers/gerencialpdotCtrl';
const router = Router();
// todas las rutas del gerencialpdot
/**
 * :pool? Nombre del pool para conectar a la base no es obligatorio
 * poolConexion valida si el nombre de pool existe en las configuraciones de conexion
 * validarJWT valida si esta autentificado para realizar la peticion de rest
 * getProyecto nombre de tu consulta logica del controlador
 */
router.post('/api/:pool?/gerencialpdot/getProyecto', poolConexion, getProyecto);
router.post('/api/:pool?/gerencialpdot/getPostMeta', poolConexion, getPostMeta);
router.post('/api/:pool?/gerencialpdot/getPostProyectoIndicador', poolConexion, getPostProyectoIndicador);
router.post('/api/:pool?/gerencialpdot/getDetalleProyecto', poolConexion, getDetalleProyecto);

export default router;