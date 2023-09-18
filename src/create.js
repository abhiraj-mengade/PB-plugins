import GIFEncoder from "gif-encoder-2";
import { createCanvas, Image } from "canvas";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
PDFDocument = require("pdfkit");

export async function createPdf(files) {
  doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("output.pdf"));

  files.forEach((file) => {
    doc.addPage().image(file, {
      fit: [250, 300],
      align: "center",
      valign: "center",
    });
  });

  doc.end();

  return doc;
}
