import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import Pool from '../database/connection';
import { generarJWT } from '../helpers/jwt';
import MenuBar from '../class/menubar';
import Utilitario from '../helpers/utilitario';
// const db = new connectionDatabase();

export const getInit = async (req: Request, res: Response) => {
    const pool = req.params.pool || 'default';
    const sql = `select a.ide_proyecto,a.ide_matriz,detalle_proyecto,detalle_meta,detalle_perspectiva,
sum(valor_variacion) as suma_porce,extract(year from fecha_variacion) as anio
from (
select a.ide_proyecto,detalle_proyecto,meta.ide_objetivo,meta.detalle_objetivo as detalle_meta,ide_matriz,detalle_perspectiva
from ge_proyecto a, ge_objetivo meta,ge_matriz_frecuencia c,ge_perspectiva d
where a.ide_proyecto=meta.ide_proyecto
and meta.ide_objetivo = c.ide_objetivo
and c.ide_perspectiva = d.ide_perspectiva	
) a, (
select ide_matriz,valor_variacion,fecha_variacion
from ge_variacion 
	) b where a.ide_matriz=b.ide_matriz
group by extract(year from fecha_variacion),
a.ide_proyecto,a.ide_matriz,detalle_proyecto,detalle_meta,detalle_perspectiva`;
    try {
        // const options = Pool.getConnectionOptions().database;
        const data = await Pool.consultar(sql, []);
        // console.log(options);
        res.json({ datos: data });
    } catch (error) {
        console.error(error);
        res.status(404).json(error);
    }
}

export const login = async (req: Request, res: Response): Promise<Response> => {
    const { username, password, ip, device, userAgent } = req.body;
    // console.log(req.body);
    const sql = `select ide_segusu,a.ide_segper,nombre_segper,nombre_segusu,fecha_reg_segusu,activo_segusu,
    bloqueado_segusu,cambia_clave_segusu, fecha_caduc_segusu,password_segusu,foto_segusu,username_segusu,
    correo_segusu
    from seg_usuario a, seg_perfil b
    where a.ide_segper=b.ide_segper and username_segusu = $1 and activo_segusu=true`;
    try {
        const data = await Pool.consultar(sql, [username]);
        if (data.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario y contraseña incorrecta o no está activo' });
        }
        if (!bcrypt.compareSync(password, data[0].password_segusu)) {
            return res.status(401).json({ mensaje: 'Usuario y contraseña incorrecta' });
        }
        if (data[0].bloqueado_segusu === true || data[0].bloqueado_segusu === null || data[0].bloqueado_segusu === undefined) {
            return res.status(401).json({ mensaje: 'El usuario esta bloqueado contactese con el administrador del sistema' });
        }
        if (data[0].fecha_caduc_usua !== null || data[0].fecha_caduc_usua !== undefined) {
            const fechaCaduca = Utilitario.transformarFecha(data[0].fecha_caduc_segusu);
            // console.log( Utilitario.fechaActual(), fechaCaduca);
            if (fechaCaduca < Utilitario.fechaActual()) {
                return res.status(401).json({ mensaje: 'La vigencia de su cuenta a caducado, contactese con el administrador del sistema' });
            };
        }
        if (!await isPerfilActivo(data[0].ide_segper)) {
            return res.status(401).json({ mensaje: 'El perfil de su usuario esta desactivado, contactese con el administrador del sistema' });
        }
        if (data[0].cambia_clave_segusu === false) {
            // const parametros = [{ ide_segusu: data[0].ide_segusu, ide_seacau: 1, fecha_seauac: Utilitario.fechaActual(), hora_seauac: Utilitario.horaActual(), ip_seauac: ip, fin_seauac: false, detalle_seauac: 'Ingresó al sistema' }];
            const auditoria = await crearSQLAuditoriaAcceso(data[0].ide_segusu, 3, 'Ingresó al sistema', ip, device, userAgent);
        }
        const datos = {
            foto: data[0].foto_segusu, ide_segusu: data[0].ide_segusu, username: data[0].username_segusu, nombre: data[0].nombre_segusu,
            perfil: data[0].nombre_segper, fecha_caduc_segusu: data[0].fecha_caduc_segusu, fecha_reg_segusu: data[0].fecha_reg_segusu,
            correo_segusu: data[0].correo_segusu
        }
        // genero token
        const token = await generarJWT(datos);
        // ultimo acceso
        const ultimoAcceso = await ultimoAccesoUsuario(data[0].ide_segusu, 4);
        // generara menu de permisos
        const menuOpcion = await getMenu(data[0].ide_segper);
        return res.json({ ide_segusu: data[0].ide_segusu, datos, menu: menuOpcion, token, cambia_clave: data[0].cambia_clave_segusu, ultimoAcceso });
    } catch (error) {
        console.log(error);
        return res.status(400).json(error);
    }
}

export const logout = async (req: Request, res: Response): Promise<Response> => {
    const { ide_segusu, ip, device, userAgent } = req.body;
    // console.log(req);
    try {
        const auditoria = crearSQLAuditoriaAcceso(ide_segusu, 4, 'Salió del sistema', ip, device, userAgent);
        return res.json(auditoria);
    } catch (error) {
        console.log(error);
        return res.status(400).json(error);
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const { nombre, correo_segusu, ide_segusu } = req.body;
    // console.log(req);
    const sql = `update seg_usuario set nombre_segusu=$1, correo_segusu=$2 where ide_segusu=$3`;
    try {
        const data = Pool.ejecutarQuery(sql, [nombre, correo_segusu, ide_segusu]);
        return res.json(data);
    } catch (error) {
        console.log(error);
        return res.status(400).json(error);
    }
}


export const tokenrenew = async (req: any, res: Response) => {

    const { data } = req.usuario;
    // Generar el TOKEN - JWT

    // Obtener el usuario por UID
    const sql = `select ide_segusu,a.ide_segper,nombre_segper,nombre_segusu,fecha_reg_segusu,activo_segusu,
    bloqueado_segusu,cambia_clave_segusu, fecha_caduc_segusu,password_segusu,foto_segusu,username_segusu,
    correo_segusu
    from seg_usuario a, seg_perfil b
    where a.ide_segper=b.ide_segper and ide_segusu = $1 `;
    try {
        const usuario = await Pool.consultar(sql, [data.ide_segusu]);
        delete usuario.ide_segper;
        const datos = {
            foto: usuario[0].foto_segusu, ide_segusu: usuario[0].ide_segusu, username: usuario[0].username_segusu, nombre: usuario[0].nombre_segusu,
            perfil: usuario[0].nombre_segper, fecha_caduc_segusu: usuario[0].fecha_caduc_segusu, fecha_reg_segusu: usuario[0].fecha_reg_segusu,
            correo_segusu: usuario[0].correo_segusu
        }
        const token = await generarJWT(datos);
        // generara menu de permisos
        const menuOpcion = await getMenu(usuario[0].ide_segper);
        return res.json({
            ok: true,
            token,
            datos: usuario,
            menu: menuOpcion
        });
    } catch (error) {
        console.log(error.detail);
        return res.status(400).json(error)
    }

}

export const pantallasMasUsadas = async (req: any, res: Response) => {
    // console.log(req.body);
    const { ide_segusu } = req.body;
    // Obtener el usuario por UID
    const sql = `select detalle_seauac,(select nombre_segopc from seg_opcion where ide_segopc=a.detalle_seauac::integer),count(detalle_seauac) 
    from seg_auditoria_acceso a
    where ide_segusu=$1 and ide_seacau=1
    GROUP BY ide_segusu,detalle_seauac
    order by 3 desc
    limit 5 `;
    // console.log(sql, ide_segusu);
    try {
        const data = await Pool.consultar(sql, [ide_segusu]);
        return res.json({
            ok: true,
            datos: data
        });
    } catch (error) {
        console.log(error.detail);
        return res.status(400).json(error)
    }

}

async function isPerfilActivo(perfil: number) {
    const sql = `select ide_segper,activo_segper from seg_perfil where ide_segper = $1 `;
    const data = await Pool.consultar(sql, [perfil]);
    if (data[0].activo_segper === null || data[0].activo_segper === undefined || data[0].activo_segper === false) {
        // console.log('ingrese al false');
        return false;
    } else {
        // console.log('ingrese al true');
        return true;
    }
}

export async function crearSQLAuditoriaAcceso(usuario: number, accion: number, detalle: string, ip: string, device: string, userAgent: string) {
    const parametros = [{ ide_segusu: usuario, ide_seacau: accion, fecha_seauac: Utilitario.fechaActual(), hora_seauac: Utilitario.horaActual(), ip_seauac: ip, fin_seauac: false, detalle_seauac: detalle, device_seauac: device, useragent_seauac: userAgent }];
    // console.log(parametros);
    const data = await Pool.insertar('seg_auditoria_acceso', parametros);
    return data;
}

async function ultimoAccesoUsuario(usuario: number, accion: number) {
    let fecha = null;
    const data = await Pool.consultar(`select * from seg_auditoria_acceso where ide_segusu=$1 and ide_seacau=$2
    and ide_seauac = (select max(ide_seauac) from seg_auditoria_acceso where ide_segusu=$1 and ide_seacau=$2 and fin_seauac=false)
    `, [usuario, accion]);
    if (data.length > 0) {
        fecha = Utilitario.transformarFecha(data[0].fecha_seauac) + ' ' + data[0].hora_seauac || null;
    }
    return fecha;
}

async function getMenu(perfil: number) {
    const menuOpciones = new Array<MenuBar>();
    const lista = await Pool.consultar(`SELECT a.ide_segopc,nombre_segopc,a.seg_ide_segopc,ruta_segopc,icono_segopc,
    (SELECT count(seg_ide_segopc) from seg_opcion where seg_ide_segopc=a.ide_segopc)
    FROM seg_opcion a ,seg_perfil_opcion b
    WHERE a.ide_segopc=b.ide_segopc
    AND b.ide_segper = $1
    ORDER BY a.seg_ide_segopc desc,nombre_segopc`, [perfil]);

    for (const actual of lista) {
        if (actual.seg_ide_segopc === null) {
            const menus = new MenuBar();
            if (actual.count > 0) {
                // console.log("> " + actual.nom_opci);
                menus.data = actual.ide_segopc
                menus.titulo = actual.nombre_segopc;
                menus.icono = actual.icono_segopc;
                menus.path = actual.ruta_segopc;
                menuOpciones.push(menus);
                formar_menu_recursivo(menus, actual, lista);
                continue;
            }
            menus.data = actual.ide_segopc
            menus.titulo = actual.nombre_segopc;
            menus.path = actual.ruta_segopc;
            menus.icono = actual.icono_segopc;
            menuOpciones.push(menus);
            // console.log("* " + actual.nom_opci);
        }
    }
    return menuOpciones;
}

function formar_menu_recursivo(menu: MenuBar, fila: any, lista: any) {
    const child = Array<MenuBar>();
    for (const filaActual of lista) {
        if (fila.ide_segopc === filaActual.seg_ide_segopc) {
            const menuNuevo = new MenuBar();
            if (filaActual.count > 0) {
                // console.log(">> " + filaActual.nom_opci);
                menuNuevo.data = filaActual.ide_segopc
                menuNuevo.titulo = filaActual.nombre_segopc;
                menuNuevo.icono = filaActual.nombre_segopc;
                menuNuevo.path = filaActual.ruta_segopc;
                child.push(menuNuevo);
                menu.submenu = child;
                // menuOpciones.submenu = menu;
                formar_menu_recursivo(menuNuevo, filaActual, lista);
                continue;
            }
            menuNuevo.data = filaActual.ide_segopc
            menuNuevo.titulo = filaActual.nombre_segopc;
            menuNuevo.icono = filaActual.icono_segopc;
            menuNuevo.path = filaActual.ruta_segopc;
            child.push(menuNuevo);
            menu.submenu = child;
            // menuOpciones.submenu = menu;
            // console.log("-- " + filaActual.nom_opci);
        }
    }
    // console.log(menu);
}