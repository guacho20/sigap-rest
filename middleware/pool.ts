import { NextFunction, Request, Response } from "express";
import Pool from '../database/connection';

export const poolConexion = async (req: Request, res: Response, next: NextFunction) => {
    let pool = req.params.pool;
    if (pool === undefined) {
        pool = 'default';
    }
    // console.log(pool);
    Pool.setPool(pool);
    next()
}
