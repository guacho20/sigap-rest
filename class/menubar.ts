export default class MenuBar {
    titulo: string | undefined;
    data: number | undefined;
    icono?: string | undefined;
    submenu?: MenuBar[];
    path?: string | undefined;
}