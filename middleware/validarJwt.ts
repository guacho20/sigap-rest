import { NextFunction, Request, Response } from "express";
import { comprobarToken } from '../helpers/jwt';

export const validarJWT = async (req: any, res: Response, next: NextFunction) => {
    const token = req.header('x-token');
    // console.log(token);
    if (!token) {
        return res.status(401).json({ token:false, mensaje: 'No hay token en la petición' })
    }
    try {
        const data = await comprobarToken(token);
        // console.log(data);
        req.usuario = data;
        next()
    } catch (error) {
        return res.status(401).json({caducado: true, mensaje: 'Se ha terminado la sección por inactividad en el sistema' });
    }
}