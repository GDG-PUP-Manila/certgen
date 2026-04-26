import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs/promises';

export const convertPngToPdf = async (textBuffer: Buffer, templateFilename: string = "base-template-optimized.jpg"): Promise<Buffer> => {
  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 1. Draw Background Image natively so PDFKit retains its original compression and high quality
      const templatePath = path.resolve(`./public/templates/${templateFilename}`);
      const bgBuffer = await fs.readFile(templatePath);
      doc.image(bgBuffer, 0, 0, { width: 841.89, height: 595.28 }); // A4 Landscape points

      // 2. Draw 4K Transparent Text Overlay perfectly on top
      doc.image(textBuffer, 0, 0, { width: 841.89, height: 595.28 });
      
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};
