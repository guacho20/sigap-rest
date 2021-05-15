import jwt from 'jsonwebtoken';

export const generarJWT = (data: any) => {
    return new Promise((resolve, reject) => {
        const payload = { data };
        // console.log(process.env.SECRET_KEY, process.env.EXPIRE_JWT);
        jwt.sign(payload, process.env.SECRET_KEY || 'secret-key', { expiresIn: "20m", }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el JWT');
            } else {
                resolve(token);
            }
        })
    });
}

export const comprobarToken = (token: any) => {
    return new Promise((resolve, reject) => {
        const data = jwt.verify(token, process.env.SECRET_KEY || 'secret-key');
        if (!data) {
            reject('Error verificar token');
        }
        resolve(data);
    })
}