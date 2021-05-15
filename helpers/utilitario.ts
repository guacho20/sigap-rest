import moment from "moment";

export default class Utilitario {

    static fechaActual(formato?: string) {
        if (formato === undefined) {
            formato = 'DD-MM-YYYY';
        }
        return moment(Date.now()).format(formato);
    }

    static horaActual() {
        return moment(Date.now()).format('HH:mm:ss');
    }

    static transformarFecha(fecha: string, formato?: string) {
        if (formato === undefined) {
            formato = 'DD-MM-YYYY';
        }
        return moment(fecha).format(formato);
    }
}