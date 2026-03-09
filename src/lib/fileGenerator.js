import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';

export const exportToFile = async (format, content, title = 'Documento_AVATIA') => {
    const fileName = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}`;

    switch (format) {
        case 'pdf':
            const pdf = new jsPDF();
            // Dividir el texto en líneas para que quepa en el PDF
            const splitText = pdf.splitTextToSize(content, 180);
            pdf.text(splitText, 10, 10);
            pdf.save(`${fileName}.pdf`);
            break;

        case 'xlsx':
            // Intentar extraer tablas del markdown si existen
            const rows = content.split('\n').filter(line => line.includes('|')).map(line => {
                return line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            }).filter(row => row.length > 0 && !row[0].startsWith('---'));

            const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [[content]]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Hoja 1");
            XLSX.writeFile(wb, `${fileName}.xlsx`);
            break;

        case 'docx':
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: content.split('\n').map(line => new Paragraph({
                        children: [new TextRun(line)],
                    })),
                }],
            });
            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${fileName}.docx`);
            break;

        case 'ppt':
            const pres = new pptxgen();
            const slide = pres.addSlide();
            slide.addText(title, { x: 1, y: 0.5, fontSize: 24, color: '363636' });
            // Dividir contenido en puntos clave si es posible
            slide.addText(content, { x: 1, y: 1.5, fontSize: 14, color: '646464', w: '80%' });
            pres.writeFile({ fileName: `${fileName}.pptx` });
            break;

        default:
            console.error('Formato no soportado');
    }
};
