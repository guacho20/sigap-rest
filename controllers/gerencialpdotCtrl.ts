import { Request, Response } from 'express';
import Pool from '../database/connection';
// el controlador es la parte logica de la db

export const getProyecto = async (req: Request, res: Response) => {
    const sql = `select ide_proyecto,detalle_proyecto from ge_proyecto order by detalle_proyecto`;
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
        res.status(500).json(error);
    }
}
export const getPostMeta = async (req: Request, res: Response) => {
    const { ide_proyecto } = req.body;
    const sql = `select ide_objetivo,detalle_objetivo from ge_objetivo where ide_proyecto=$1`;
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
        res.status(500).json(error);
    }
}
export const getPostProyectoIndicador = async (req: Request, res: Response) => {
    const { ide_proyecto, ide_objetivo } = req.body;
    const sql = `select ide_matriz,detalle_perspectiva as indicador,a.ide_proyecto,meta.ide_objetivo
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
        res.status(500).json(error);
    }
}