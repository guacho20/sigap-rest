import { Connection, ConnectionOptions, createConnections, getConnection, UpdateQueryBuilder } from 'typeorm';

export default class Pool {

    static opciones: ConnectionOptions;
    static pool: string;

    constructor() {
        createConnections();
    }

    private static coneccion(): Connection {
        const conexion = getConnection(this.pool);
        this.setConnectionOptions(conexion.options);
        return conexion;
    }

    static setPool(pool: string) {
        this.pool = pool;
    }

    static setConnectionOptions(options: ConnectionOptions) {
        this.opciones = options;
    }

    /**
     * Opciones de pool conectado
     * @returns ConnectionOptions
     */
    static getConnectionOptions() {
        return this.opciones;
    }

    /**
     * Metodo de consulta
     * @param query {string} sql
     * @param parameters {any[]} condicion con parametros
     * @returns Promise<any>
     */
    static async consultar(query: string, parameters?: any[]): Promise<any> {
        return await this.coneccion().query(query, parameters);
    }

    /**
     * Metodo para ejecutar cualquier query
     * @param query sql
     * @param parameters condicion con parametros
     * @returns Promise<any>
     */
    static async ejecutarQuery(query: string, parameters?: any[]): Promise<any> {
        return await this.coneccion().query(query, parameters);
    }

    /**
     * Permite consultar los campos deseados del sql para los servicios
     * @param campos campos del sql
     * @param sql sql o query
     * @returns Promise<any>
     */
    static async consultarSqlServicio(campos: string ,sql: string,): Promise<any> {
        const query = `select ${campos} from ( ${sql} ) a`;
        return await this.coneccion().query(query);
    }

    /**
     * Permite insertar datos en una tabla
     * @param nombreTabla nombre de la tabla
     * @param datos datos
     * @param resultado que campo desea retornar despues de insertar por defaul all
     * @returns Promise<any>
     */
    static async insertar(nombreTabla: string, datos: any, resultado?: any): Promise<any> {
        if (resultado === undefined) {
            resultado = '*';
        }
        return await this.coneccion().createQueryBuilder()
            .insert()
            .into(nombreTabla)
            .values(datos)
            .returning(resultado)
            .execute();
    }

    /**
     * Permite actualizar los datos de una tabla
     * @param nombreTabla nombre de tabla
     * @param parameters campos
     * @param condiciones condicion
     * @returns Promise<any>
     */
    static async actualizar(nombreTabla: string, parameters: UpdateQueryBuilder<unknown>, condiciones: any): Promise<any> {
        const { condicion, valores } = condiciones[0];
        return await this.coneccion().createQueryBuilder()
            .update(nombreTabla)
            .set(parameters)
            .where(condicion, valores)
            .execute();
    }

    /**
     * Permite eliminar los datos de una tabla
     * @param query sql
     * @param parameters condicion
     * @returns Promise<any>
     */
    static async eliminar(query: string, parameters?: any[]): Promise<any> {
        return await this.coneccion().query(query, parameters);
    }
}
