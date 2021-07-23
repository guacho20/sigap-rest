import { Request, Response } from 'express';
import PdfMakePrinter from 'pdfmake';
import Pool from '../database/connection';
import Utilitario from '../helpers/utilitario';
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
        select a.ide_proyecto,detalle_proyecto, detalle_meta,detalle_perspectiva,abreviatura_ystmen,a.ide_matriz,
        sum(valor_variacion) as suma_porce,extract(year from fecha_variacion) as anio, a.ide_perspectiva
        from (
        select a.ide_proyecto,detalle_proyecto,d.ide_perspectiva,abreviatura_ystmen,meta.ide_objetivo,meta.detalle_objetivo as detalle_meta,ide_matriz,detalle_perspectiva
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
        ,detalle_meta,detalle_perspectiva,abreviatura_ystmen,a.ide_matriz, a.ide_perspectiva 
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

export const getProyectosAsignados = async (req: Request, res: Response) => {
    const { ide_segusu } = req.body;
    const sql = `select a.ide_objetivo,detalle_proyecto,detalle_objetivo
		from ge_objetivo a, ge_objetivo_responsable b ,ge_responsable c, ge_proyecto d
		where a.ide_proyecto=d.ide_proyecto and a.ide_objetivo=b.ide_objetivo and b.ide_responsable=c.ide_responsable
		and ide_segusu=$1`;
    try {
        // console.log(req.body, sql);
        const data = await Pool.consultar(sql, [ide_segusu]);
        res.json({ error: false, datos: data });
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }
}

export const getPrintReporte = async (req: Request, res: Response) => {
    const { ide_segusu, usuario } = req.body;
    const sql = `select a.ide_proyecto,detalle_proyecto, detalle_meta,detalle_perspectiva,abreviatura_ystmen,a.ide_matriz,
    sum(valor_variacion) as suma_porce,extract(year from fecha_variacion) as anio, a.ide_perspectiva
    from (
    select a.ide_proyecto,detalle_proyecto,d.ide_perspectiva,abreviatura_ystmen,meta.ide_objetivo,meta.detalle_objetivo as detalle_meta,ide_matriz,detalle_perspectiva
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
    ,detalle_meta,detalle_perspectiva,abreviatura_ystmen,a.ide_matriz, a.ide_perspectiva 
    having a.ide_objetivo in (select ide_objetivo from ge_responsable a, ge_objetivo_responsable b 
	where a.ide_responsable=b.ide_responsable and ide_segusu=$1)`;
    try {
        const data = await Pool.consultar(sql, [ide_segusu]);

        const columnaData = ['detalle_proyecto', 'detalle_meta', 'detalle_perspectiva', 'abreviatura_ystmen', 'suma_porce', 'anio'];
        const cabeceraData = ['PROYECTO', 'META', 'INDICADOR', 'ABREVIATURA', 'AVANCE', 'AÑO'];

        // formo el pdf 

        const documentDefinition = {
            pageSize: 'A4',
            info: {
                title: 'REPORTE DE AVANCE DE PROYECTOS',
                author: 'SIGAP',
                subject: 'REPORTE DE AVANCE DE PROYECTOS',
                keywords: 'REPORTE DE AVANCE DE PROYECTOS',
            },
            /* header: {
                margin: [40, 10, 40, 0],
                columns:[

                    {
                        text: 'Usuario: ' + usuario,
                        alignment: 'left',
                        fontSize: 10,

                    },
                    {
                        text: 'GADP DE SANTO DOMINGO DE LOS TSÁCHILAS',
                        fontSize: 15,
                        bold: true,
                        alignment: 'right',
                    }
                ]
            }, */
            footer: function (currentPage: { toString: () => string; }, pageCount: string) {
                var columns = [

                    {
                        text: 'Usuario: ' + usuario,
                        alignment: 'left',
                        fontSize: 10,

                    },
                    {
                        text: 'Fecha: ' + Utilitario.fechaActual('YYYY-MM-DD HH:mm:ss'),
                        alignment: 'center',
                        fontSize: 10,

                    },
                    {
                        text: "Página " + currentPage.toString() + ' de ' + pageCount,
                        alignment: 'right',
                        fontSize: 10
                    }
                ]
                return { margin: [40, 10, 40, 0], columns };
            },
            content: [
                /* { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 595 - 2 * 40, y2: 5, lineWidth: 1 }] },
                '\n', */
                { text: 'AVANCE DE PROYECTOS', style: 'header' },
                '\n',
                table(data, columnaData, cabeceraData)
            ],
            styles: {
                header: {
                    fontSize: 12,
                    bold: true
                },
                subheader: {
                    fontSize: 15,
                    bold: true
                },
                quote: {
                    italics: true
                },
                small: {
                    fontSize: 8
                },
                tableExample: {
                    fontSize: 10,
                    alignment: 'justify'
                },
            }

        };

        // res.send(ide_segusu);
        generatePdf(documentDefinition, response => res.json(response));
    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }

}

function buildTableBody(data: any[], columns: any[], cabecera: any[]) {
    var body = [];

    body.push(cabecera);

    data.forEach(function (row: { [x: string]: { toString: () => any; }; }) {
        var dataRow: any[] = [];

        columns.forEach(function (column: string | number) {
            dataRow.push(row[column].toString());
        })

        body.push(dataRow);
    });

    return body;
}

function table(data: any, columns: any, cabecera: any) {
    return {
        style: 'tableExample',
        table: {
            headerRows: 1,
            body: buildTableBody(data, columns, cabecera)
        }
    };
}
const fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
};
const generatePdf = (docDefinition: any, callback: (arg0: string) => void) => {
    try {
        const printer = new PdfMakePrinter(fonts);
        const doc = printer.createPdfKitDocument(docDefinition);
        const chunks: any[] = [];

        doc.on('data', (chunk: any) => {
            chunks.push(chunk);
        });

        doc.on('end', () => {
            const result = Buffer.concat(chunks);
            // console.log(result);
            callback(`data:application/pdf;base64,${result.toString('base64')}`);
        });

        doc.end();
    } catch (err) {
        throw (err);
    }
};