import { Connection, ConnectionOptions, createConnections, getConnection, UpdateQueryBuilder } from 'typeorm';

export default class Pool {

    static opciones: ConnectionOptions;
    static pool: string;

    constructor() {
        createConnections();
    }

    private static coneccion(): Connection {
        const conexion = getConnection(this.pool);
        // console.log('Este es el pool para la coneccion de query', this.pool, this.opciones);
        this.setConnectionOptions(conexion.options);
        return conexion;
    }

    static setPool(pool: string) {
        this.pool = pool;
    }

    static setConnectionOptions(options: ConnectionOptions) {
        this.opciones = options;
    }

    static getConnectionOptions() {
        return this.opciones;
    }

    static async consultar(query: string, parameters?: any[]): Promise<any> {
        return await this.coneccion().query(query, parameters);
    }

    static async insertar(nombreTabla: string, parameters: any): Promise<any> {
        return await this.coneccion().createQueryBuilder()
            .insert()
            .into(nombreTabla)
            .values(parameters)
            .execute();
    }

    static async actualizar(nombreTabla: string, parameters: UpdateQueryBuilder<unknown>, condiciones: any): Promise<any> {
        const { condicion, valores } = condiciones[0];
        return await this.coneccion().createQueryBuilder()
            .update(nombreTabla)
            .set(parameters)
            .where(condicion, valores)
            .execute();
    }

    static async eliminar(query: string, parameters?: any[]): Promise<any> {
        return await this.coneccion().query(query, parameters);
    }
}