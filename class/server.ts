import express, { Application } from 'express';
import cors from 'cors';

import auth from './../routes/auth';
import seguridad from './../routes/seguridad';

class Server {

    private app: Application;
    private port: string;

    constructor() {
        this.app = express();
        this.port = process.env.PORT || '3000';

        this.app.use(cors());
        this.app.use(express.json());

        this.routes();
    }

    routes() {
        this.app.use(auth)
        this.app.use(seguridad)
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Servidor corriendo en el puerto ' + this.port);
        })
    }
}

export default Server;