import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Pool from '../database/connection';
import Arbol from '../class/arbol';
import { crearSQLAuditoriaAcceso } from './authCtrl';

export const getColumna = async (req: Request, res: Response): Promise<Response> => {
    const { nombreTabla, numeroTabla, ideOpcion } = req.body;
    let data;
    try {
        const resp = await getTabla(nombreTabla, numeroTabla, ideOpcion);
        if (resp.length > 0) {
            data = resp;
        } else {
            data = await getSquema(nombreTabla);
        }
        return res.json({ datos: data });
    } catch (error) {
        console.log(error.detail);
        return res.status(400).json(error)
    }
}

export const getConsultarTabla = async (req: Request, res: Response) => {
    const { nombreTabla, campoOrden, condiciones, filas, pagina } = req.body;
    let sql = '';
    let valorData = [];
    if (condiciones.length > 0) {
        sql = `select * from ${nombreTabla} WHERE 1 = 1 AND ${condiciones[0].condicion} order by ${campoOrden}`
        valorData = condiciones[0].valores;
        // console.log('tiene condicion', condiciones, valorData);
    } else {
        sql = `select * from ${nombreTabla}  order by ${campoOrden} `;
    }

    // console.log(sql, valorData);

    try {
        const data = await Pool.consultar(sql, valorData);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error)
    }

};

export const getConsultarArbol = async (req: Request, res: Response) => {
    const { nombreTabla, campoOrden, condiciones, campoPrimario, campoNombre, campoPadre, } = req.body;
    const menuArbol = new Array<Arbol>();
    const sql = `select ${campoPrimario} as data,${campoNombre} as label,${campoPadre} as padre,
    (select count(${campoPadre}) as total from ${nombreTabla}
    where ${campoPadre}=a.${campoPrimario})
    from ${nombreTabla} a
    -- where 1=1" + this.condicion + " " + this.condicionEmpresa + "
    order by ${campoPadre} desc,${campoOrden}`;
    try {
        const data = await Pool.consultar(sql);
        for (const actual of data) {
            if (actual.padre === null) {
                const fila = new Arbol();
                if (actual.total > 0) {
                    // console.log("> " + actual.nom_opci);
                    fila.collapsedIcon = "pi pi-folder";
                    fila.expandedIcon = "pi pi-folder-open";
                    fila.data = actual.data;
                    fila.label = actual.label;
                    menuArbol.push(fila);
                    formar_arbol_recursivo(fila, actual, data);
                    continue;
                }
                fila.data = actual.data;
                fila.padre = actual.padre;
                fila.label = actual.label;
                fila.icon = 'pi pi-file';
                menuArbol.push(fila);
                // console.log("* " + actual.nom_opci);
            }
        }
        res.json({ error: false, datos: menuArbol });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const getCombo = async (req: Request, res: Response) => {
    const { nombreTabla, campoPrimario, campoNombre, condicion, campos } = req.body;
    let sqlCondicion = "";
    if (condicion) {
        sqlCondicion = " WHERE 1 = 1 AND " + condicion;
    }
    const query = `SELECT ${campoPrimario} AS value, ${campoNombre} AS label
        FROM ${nombreTabla}
        ${sqlCondicion}
        ORDER BY ${campoNombre}`;
    try {
        // console.log('sql del combo', query);
        const data = await Pool.consultar(query);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const cambiarClave = async (req: Request, res: Response) => {
    const { ide_segusu, contrasenaActual, nuevaContrasena } = req.body;
    const query = `update seg_usuario set password_segusu =$1 where ide_segusu=$2`;
    try {
        const usuario = await Pool.consultar('select password_segusu from seg_usuario where ide_segusu=$1', [ide_segusu]);
        if (!bcrypt.compareSync(contrasenaActual, usuario[0].password_segusu)) {
            return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
        }
        const newPassword = await bcrypt.hashSync(nuevaContrasena, 10);
        const data = await Pool.ejecutarQuery(query, [newPassword, ide_segusu]);
        res.json({ error: false, mensaje: 'Se actualizo la contraseña' });
    } catch (error) {
        console.log(error.detail || error);
        res.status(400).json(error);
    }
}

export const changePassword = async (req: Request, res: Response) => {
    const { uid_usuario, contrasenaActual, nuevaContrasena } = req.body;
    // console.log(req.body);
    const query = `update seg_usuario set password_segusu =$1 , cambia_clave_segusu=false where ide_segusu=$2`;
    try {
        const usuario = await Pool.consultar('select password_segusu from seg_usuario where ide_segusu=$1', [uid_usuario]);
        // console.log(usuario);
        if (!bcrypt.compareSync(contrasenaActual, usuario[0].password_segusu)) {
            return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
        }
        const newPassword = await bcrypt.hashSync(nuevaContrasena, 10);
        const data = await Pool.ejecutarQuery(query, [newPassword, uid_usuario]);
        res.json({ error: false, mensaje: 'Se actualizo la contraseña' });
    } catch (error) {
        console.log(error.detail || error);
        res.status(400).json(error);
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    const { uid_usuario, nuevaContrasena } = req.body;
    // console.log(req.body);
    const query = `update seg_usuario set password_segusu =$1 , cambia_clave_segusu=true where ide_segusu=$2`;
    try {
        const newPassword = await bcrypt.hashSync(nuevaContrasena, 10);
        const data = await Pool.ejecutarQuery(query, [newPassword, uid_usuario]);
        res.json({ error: false, mensaje: 'Se actualizo la contraseña' });
    } catch (error) {
        console.log(error.detail || error);
        res.status(400).json(error);
    }
}

export const getReglasClaveString = async (req: Request, res: Response) => {
    const query = `select nombre_serecl, longitud_minima_serecl, num_carac_espe_serecl,
    num_mayus_serecl, num_minusc_serecl, num_numeros_serecl,longitud_login_serecl from seg_reglas_clave`;
    const reglas = [];
    try {
        const data = await Pool.consultar(query);
        if (data) {
            const lonmin = data[0].longitud_minima_serecl || 0;
            const lonmax = data[0].longitud_login_serecl || 0;
            const num = data[0].num_numeros_serecl || 1;
            const minus = data[0].num_minusc_serecl || 1;
            const mayus = data[0].num_mayus_serecl || 1;
            const char = data[0].longitud_login_serecl || 8;
            const carspe = data[0].longitud_login_serecl || 0;
            reglas.push(
                {
                    regla: `Tener de ${lonmin} a ${lonmax} caracteres`,
                },
                {
                    regla: `Incluir ${mayus} mayúscula, ${minus} minúscula y ${num} número`,
                }, {
                regla: `Puede contener caracteres especiales`,
            })
        }
        res.json({ error: false, datos: reglas });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const egecutarListaSql = async (req: Request, res: Response) => {
    // console.log(JSON.stringify(req.body));
    try {
        const datos = req.body.listaSQL;
        datos.sort((a: any, b: any) => (b.valores[b.campoPrimario] < a.valores[a.campoPrimario] ? -1 : 1));
        let cont = 0;
        // TODO: recorro la lista de sql
        for (const data of datos) {
            if (data.tipo === 'insertar') {
                cont = cont + 1;
                delete data.valores[data.campoPrimario];
                // console.log('** veces rrecorrido, ', cont);
                // console.log('    ==>', data.nombreTabla, data.campoPrimario, data.valores[data.campoPrimario]);
                // console.log('    > inserto padre');
                const uid = await Pool.insertar(data.nombreTabla, data.valores, data.campoPrimario);
                // console.log('    SQL : ', uid);
                // console.log('    < retorno pk', 100);
                const tablasHijas = data.relacion.split(',');
                // TODO: verifico si la tabla tiene tablas hijas relacionadas y recorro las tablas relacionadas
                if (tablasHijas.length > 0) {
                    for (const tabla of tablasHijas) {
                        // TODO: verifico si la tabla relacionada tiene registros hijos
                        const hijos = datos.filter((hijo: any) => { return hijo.nombreTabla === tabla; });
                        hijos.sort((a: any, b: any) => (b.valores[b.campoPrimario] < a.valores[a.campoPrimario] ? -1 : 1));
                        // console.log('        ***# ', hijos);
                        // console.log('        ***# ' + hijos.length + ' #***');
                        if (hijos.length > 0) {
                            // console.log('    >> Tengo hijos');
                            for (const hijo of hijos) {
                                delete hijo.valores[hijo.campoPrimario];
                                hijo.valores[hijo.campoforanea] = uid.raw[0][data.campoPrimario];
                                // console.log('        ==>', hijo.nombreTabla, hijo.campoPrimario, hijo.valores[hijo.campoPrimario]);
                                // console.log('        > inserto padre');
                                const uid1 = await Pool.insertar(hijo.nombreTabla, hijo.valores);
                                // console.log('SQL : ', uid1);
                                // console.log('        < retorno pk', 200);
                                removeItemFromArr(datos, hijo);
                                const tablasHijas1 = hijo.relacion.split(',');
                                if (tablasHijas1.length > 0) {
                                    for (const tabla1 of tablasHijas1) {
                                        const hijos1 = datos.filter((hijo1: any) => { return hijo1.nombreTabla === tabla1; });
                                        hijos1.sort((a: any, b: any) => (b.valores[b.campoPrimario] < a.valores[a.campoPrimario] ? -1 : 1));
                                        // console.log('            ***# ', hijos1);
                                        // console.log('            ***# ' + hijos1.length + ' #***');
                                        if (hijos1.length > 0) {
                                           //  console.log('        >> Tengo hijos');
                                            for (const hijo2 of hijos1) {
                                                delete hijo2.valores[hijo2.campoPrimario];
                                                hijo2.valores[hijo2.campoforanea] = uid1.raw[0][hijo.campoPrimario];
                                              //   console.log('            ==>', hijo2.nombreTabla, hijo2.campoPrimario, hijo2.valores[hijo2.campoPrimario]);
                                                // console.log('            > inserto padre');
                                                const uid2 = await Pool.insertar(hijo2.nombreTabla, hijo2.valores, hijo2.campoPrimario);
                                                // console.log('SQL : ', uid2);
                                                // console.log('            < retorno pk', 300);
                                                removeItemFromArr(datos, hijo2);
                                            }
                                        } else {
                                            // console.log('        >> No tengo hijos');
                                        }
                                    }
                                }
                            }
                        } else {
                            // console.log('    >> No tengo hijos');
                            // removeItemFromArr(datos, hijo);
                        }
                    }
                }
            } else if (data.tipo === 'modificar') {
                const update = await Pool.actualizar(data.nombreTabla, data.valores, data.condiciones);
            }
        }
        res.json({ mensaje: 'echo comit ok' });
    } catch (error) {
        console.log(error.detail, error);
        res.status(400).json(error);
    }
}

export const saveUser = async (req: Request, res: Response) => {
    try {
        const datos = req.body.data;
        datos.sort((a: any, b: any) => (b.valores[b.campoPrimario] < a.valores[a.campoPrimario] ? -1 : 1));
        let cont = 0;
        // TODO: recorro la lista de sql
        for (const data of datos) {
            if (data.tipo === 'insertar') {
                delete data.valores[data.campoPrimario];
                const newPassword = await bcrypt.hashSync(data.valores['password_segusu'], 10);
        
                data.valores['password_segusu'] = newPassword;

                const uid = await Pool.insertar(data.nombreTabla, data.valores, data.campoPrimario);
               
            } else if (data.tipo === 'modificar') {
                const update = await Pool.actualizar(data.nombreTabla, data.valores, data.condiciones);
            }
        }
        res.json({ mensaje: 'echo comit ok' });
    } catch (error) {
        console.log(error.detail, error);
        res.status(400).json(error);
    }
}

export const getConsultaGenerica = async (req: Request, res: Response) => {
    const {sql, parametros} = req.body
    try {
        const data = await Pool.consultar(sql, parametros);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail, error);
        res.status(400).json(error);
    }
}

export const updateGenerico = async (req: Request, res: Response) => {
    const {sql, parametros} = req.body
    try {
        const data = await Pool.consultar(sql, parametros);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail, error);
        res.status(400).json(error);
    }
}

export const getEliminar = async (req: Request, res: Response) => {
    const { nombreTabla, campoPrimario, valorCampoPrimario } = req.body;
    const sql = `DELETE FROM ${nombreTabla} WHERE ${campoPrimario}=$1`;
    try {
        const data = await Pool.eliminar(sql, [valorCampoPrimario]);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error)
    }

};

export const auditoriaAccesoPantalla = async (req: Request, res: Response) => {
    const { ide_segusu, ide_segopc, ip, device, userAgent } = req.body;
    try {
        const data = await crearSQLAuditoriaAcceso(ide_segusu, 1, ide_segopc, ip, device, userAgent);
        // console.log('retorno ', data);
        res.json({ mensaje: 'echo comit ok' });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const getOpciones = async (req: Request, res: Response) => {
    const sql = `select a.ide_segopc as value,nombre_segopc||' | '|| nuevo as label
                from (
                select a.ide_segopc,a.nombre_segopc,b.seg_ide_segopc,( case when b.seg_ide_segopc is null then 'PANTALLA' else 'MENU' end ) as nuevo
                from seg_opcion a
                left join (
                 select DISTINCT seg_ide_segopc
                 from seg_opcion
                 where seg_ide_segopc  in ( select ide_segopc from seg_opcion ) ) b
                on a.ide_segopc=b.seg_ide_segopc order by a.nombre_segopc
                )a`;
    try {
        const data = await Pool.consultar(sql);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const getClientes = async (req: Request, res: Response) => {
    const sql = `select ide_cliente as value,cedula||' | '|| nombre as label
    from (
     select ide_cliente,cedula,nombre from rec_clientes order by ide_cliente limit 10
    )a`;
    try {
        const data = await Pool.consultar(sql);
        res.json({ error: false, datos: data, total: data.length });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

export const esUnico = async (req: Request, res: Response) => {
    const { nombreTabla, campo, valorCampo } = req.body;
    const sql = `select * from ${nombreTabla} where 1=1 and ${campo}=$1`;
    // console.log(sql);
    try {
        const data = await Pool.consultar(sql, [valorCampo]);
        console.log(data);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(400).json(error);
    }
}

async function formarGuardarRecursivo(children: any, datos: any) {
    console.info('    --> inserto padre', children.nombreTabla);
    console.log('dato insertado', children.valores[children.campoPrimario]);
    const uid = await Pool.insertar(children.nombreTabla, children.valores);
    // console.log('dato insertado', uid);
    // console.log('    retorno', uid.raw[0][children.campoPrimario]);
    const tablasHijas = children.relacion.split(',');
    // console.log(tablasHijas.length);
    if (tablasHijas.length > 0) {
        for (const tabla of tablasHijas) {
            // console.log('    Tabla hija a recorrer ', tabla);
            // TODO: verifico si tiene registros la tabla relacionada
            const hijos = datos.filter((hijo: any) => { return hijo.nombreTabla === tabla; });
            hijos.sort((a: any, b: any) => (b.valores[b.campoPrimario] < a.valores[a.campoPrimario] ? -1 : 1));
            console.log('Hijos ', hijos);
            for (const hijo of hijos) {
                delete hijo.valores[hijo.campoPrimario];
                hijo.valores[hijo.campoforanea] = 200;// uid.raw[0][children.campoPrimario];
                if (hijo.relacion) {
                    formarGuardarRecursivo(hijo, datos);
                } else {
                    console.log('    Inserto hijo ');
                    // const uidHijo = await Pool.insertar(hijo.nombreTabla, hijo.valores);
                    // console.log('    retorno ', uidHijo.raw[0][hijo.campoPrimario])
                    console.log('dato insertado', hijo.valores[hijo.campoPrimario]);
                    console.log('    Elimino el hijno insertado del array');
                    removeItemFromArr(datos, hijo);
                }
            }
        }
    }
    removeItemFromArr(datos, children);

}

/**
 * Elimina el dato de un array
 * @param arr array
 * @param item item a eliminar
 */
function removeItemFromArr(arr: any, item: any) {
    const i = arr.indexOf(item);
    if (i !== -1) {
        arr.splice(i, 1);
    }
}

async function getTabla(nombreTabla: string, numeroTabla: number, ideOpcion: number) {
    const query = `select esquema_segtab as esquema, nombre_segcam as nombre, nom_visual_segcam as nombrevisual, orden_segcam as orden, visible_segcam as visible,
        lectura_segcam as lectura, defecto_segcam as valordefecto, mascara_segcam as mascara, filtro_segcam as filtro, comentario_segcam as comentario,
        mayuscula_segcam as mayuscula, requerido_segcam as requerida, unico_segcam as unico, correo_segcam as correo
        from seg_campo a, seg_tabla b
        where a.ide_segtab=b.ide_segtab and tabla_segtab =$1 and numero_segtab=$2 and ide_segopc=$3`
    const data = await Pool.consultar(query, [nombreTabla, numeroTabla, ideOpcion]);
    return data
}

async function getSquema(nombreTabla: string) {
    const query = `select table_schema as esquema, table_name as nombretabla,column_name as nombre,column_name as nombrevisual, ordinal_position as orden,
    column_default as valordefecto,case when is_nullable ='YES' then false else true end as requerida, data_type as tipo,case when character_maximum_length is not null
    then character_maximum_length else case when numeric_precision is not null then numeric_precision end end as longitud, numeric_scale as decimales,
    case when data_type = 'bigint' then 'entero' else case when data_type = 'integer' then 'entero' else case when data_type = 'numeric' then 'decimal'
    else case when data_type = 'character varying' then 'texto' else case when data_type = 'date' then 'fecha' else case when data_type = 'time without time zone'
    then 'hora' else case when data_type = 'boolean' then 'check' else case when data_type = 'text' then 'textoArea' else case when data_type = 'timestamp with time zone'
    then 'fechaHora' end end end end end end end end end as componente
    from information_schema.columns
    where table_name = $1`;
    const data = await Pool.consultar(query, [nombreTabla]);
    return data;
}

function formar_arbol_recursivo(menu: Arbol, fila: any, lista: any) {
    const child = Array<Arbol>();
    for (const filaActual of lista) {
        if (fila.data === filaActual.padre) {
            const filaNueva = new Arbol();
            if (filaActual.total > 0) {
                filaNueva.collapsedIcon = "pi pi-folder";
                filaNueva.expandedIcon = "pi pi-folder-open";
                filaNueva.data = filaActual.data;
                filaNueva.label = filaActual.label;
                child.push(fila);
                menu.children = child;
                formar_arbol_recursivo(filaNueva, filaActual, lista);
                continue;
            }
            filaNueva.data = filaActual.data;
            filaNueva.padre = filaActual.padre;
            filaNueva.label = filaActual.label;
            filaNueva.icon = 'pi pi-file';
            child.push(filaNueva);
            menu.children = child;
        }
    }
}