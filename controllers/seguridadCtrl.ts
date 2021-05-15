import { Request, Response } from 'express';
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
        return res.status(500).json(error)
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
    const { sql } = req.body;
    try {
        const data = await Pool.consultar(sql);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error.detail);
        res.status(500).json(error);
    }
}

export const egecutarListaSql = async (req: Request, res: Response) => {
    console.log(req.body);
    try {
        for (const data of req.body.listaSQL) {

            const { tipo, campoPrimario, nombreTabla, valores, condiciones } = data;
            if (tipo === 'insertar') {
                delete valores[campoPrimario];
                // console.log('inserto', data);
                const insert = await Pool.insertar(nombreTabla, valores);
            } else if (tipo === 'modificar') {
                // console.log('modificar', data);
                const update = await Pool.actualizar(nombreTabla, valores, condiciones);
            }
        }
        res.json({ mensaje: 'echo comit ok' });
    } catch (error) {
        console.log(error.detail);
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
    const {ide_segusu, ide_opci, ip} = req.body;
    const data = crearSQLAuditoriaAcceso(ide_segusu,1,ide_opci,ip);
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