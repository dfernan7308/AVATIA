const loaders = {
  pdf: () => import('jspdf'),
  xlsx: () => import('xlsx'),
  docx: () => import('docx'),
  ppt: () => import('pptxgenjs'),
  saveAs: () => import('file-saver'),
};

export const exportToFile = async (format, content, title = 'Documento_AVATIA') => {
  const safeTitle = (title || 'Documento_AVATIA').replace(/\s+/g, '_');
  const fileName = `${safeTitle}_${Date.now()}`;

  switch (format) {
    case 'pdf': {
      const { jsPDF } = await loaders.pdf();
      const pdf = new jsPDF();
      const splitText = pdf.splitTextToSize(content, 180);
      pdf.text(splitText, 10, 10);
      pdf.save(`${fileName}.pdf`);
      break;
    }

    case 'xlsx': {
      const XLSX = await loaders.xlsx();
      const rows = content
        .split('\n')
        .filter((line) => line.includes('|'))
        .map((line) => line.split('|').map((cell) => cell.trim()).filter((cell) => cell !== ''))
        .filter((row) => row.length > 0 && !row[0].startsWith('---'));

      const worksheet = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [[content]]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoja 1');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      break;
    }

    case 'docx': {
      const [{ Document, Packer, Paragraph, TextRun }, { saveAs }] = await Promise.all([
        loaders.docx(),
        loaders.saveAs(),
      ]);

      const document = new Document({
        sections: [{
          properties: {},
          children: content.split('\n').map((line) => new Paragraph({
            children: [new TextRun(line)],
          })),
        }],
      });

      const blob = await Packer.toBlob(document);
      saveAs(blob, `${fileName}.docx`);
      break;
    }

    case 'ppt': {
      const { default: pptxgen } = await loaders.ppt();
      const presentation = new pptxgen();
      const slide = presentation.addSlide();
      slide.addText(title || 'Documento AVATIA', { x: 1, y: 0.5, fontSize: 24, color: '363636' });
      slide.addText(content, { x: 1, y: 1.5, fontSize: 14, color: '646464', w: '80%' });
      await presentation.writeFile({ fileName: `${fileName}.pptx` });
      break;
    }

    default:
      throw new Error('Formato no soportado');
  }
};
