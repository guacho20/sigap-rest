import { Request, Response } from 'express';
import Pool from '../database/connection';
// el controlador es la parte logica de la db

export const getProyecto = async (req: Request, res: Response) => {
    const sql = `select ide_proyecto as value ,detalle_proyecto as label  from ge_proyecto order by detalle_proyecto`;
    /* sql con parametros ejemplo:
        sql= select * from seg_usuario where ide_usua=$1 and parametro2=$2
        parametros = [parametro1, parametro2]
        puedes realizar de dos maneras para que ejecute el sql
        Ejem 1: Pool.consular(sql, parametros);
        Ejem 2: Pool.consular(sql, [parametro1, parametro2]);
        */
    try {
        const data = await Pool.consultar(sql);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}
export const getPostMeta = async (req: Request, res: Response) => {
    const { ide_proyecto } = req.body;
    const sql = `select ide_objetivo as value,detalle_objetivo as label from ge_objetivo where ide_proyecto=$1`;
    /* sql con parametros ejemplo:
        sql= select * from seg_usuario where ide_usua=$1 and parametro2=$2
        parametros = [parametro1, parametro2]
        puedes realizar de dos maneras para que ejecute el sql
        Ejem 1: Pool.consular(sql, parametros);
        Ejem 2: Pool.consular(sql, [parametro1, parametro2]);
        */
    try {
        const data = await Pool.consultar(sql, [ide_proyecto]);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}
export const getPostProyectoIndicador = async (req: Request, res: Response) => {
    const { ide_proyecto, ide_objetivo } = req.body;
    // ,a.ide_proyecto,meta.ide_objetivo
    const sql = `select d.ide_perspectiva as value,detalle_perspectiva as label
    from ge_proyecto a, ge_objetivo meta,ge_matriz_frecuencia c,ge_perspectiva d
    where a.ide_proyecto=meta.ide_proyecto
    and meta.ide_objetivo = c.ide_objetivo
    and c.ide_perspectiva = d.ide_perspectiva 
    and a.ide_proyecto=$1
    and meta.ide_objetivo=$2`;
    /* sql con parametros ejemplo:
        sql= select * from seg_usuario where ide_usua=$1 and parametro2=$2
        parametros = [parametro1, parametro2]
        puedes realizar de dos maneras para que ejecute el sql
        Ejem 1: Pool.consular(sql, parametros);
        Ejem 2: Pool.consular(sql, [parametro1, parametro2]);
        */
    try {
        const data = await Pool.consultar(sql, [ide_proyecto, ide_objetivo]);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}


export const getDetalleProyecto = async (req: Request, res: Response) => {
    const { ide_proyecto, ide_objetivo, ide_perspectiva } = req.body;
    let condicion = '';
    if (ide_proyecto) {
        condicion += 'having ide_proyecto=$1';
    }
    if (ide_objetivo) {
        condicion += ` and a.ide_objetivo=${ide_objetivo}`
    }
    if (ide_perspectiva) {
        condicion += ` and ide_perspectiva=${ide_perspectiva}`
    }

    if (condicion) {
        const sql = `
        select a.ide_proyecto,detalle_proyecto, detalle_meta,detalle_perspectiva,a.ide_matriz,
        sum(valor_variacion) as suma_porce,extract(year from fecha_variacion) as anio, a.ide_perspectiva
        from (
        select a.ide_proyecto,detalle_proyecto,d.ide_perspectiva,meta.ide_objetivo,meta.detalle_objetivo as detalle_meta,ide_matriz,detalle_perspectiva
        from ge_proyecto a, ge_objetivo meta,ge_matriz_frecuencia c,ge_perspectiva d
        where a.ide_proyecto=meta.ide_proyecto
        and meta.ide_objetivo = c.ide_objetivo
        and c.ide_perspectiva = d.ide_perspectiva	
        ) a, (
        select ide_matriz,valor_variacion,fecha_variacion
        from ge_variacion 
        	) b where a.ide_matriz=b.ide_matriz
        group by extract(year from fecha_variacion),
        a.ide_proyecto,a.ide_objetivo,detalle_proyecto
        ,detalle_meta,detalle_perspectiva,a.ide_matriz, a.ide_perspectiva 
        ${condicion}`;
        try {
            // console.log(req.body, sql);
            const data = await Pool.consultar(sql, [ide_proyecto]);
            res.json({ error: false, datos: data });
        } catch (error) {
            console.log(error);
            res.status(400).json(error);
        }
    }


}