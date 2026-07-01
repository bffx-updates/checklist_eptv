import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { postosBase, slugify } from "../js/data.js";

const outputDir = path.resolve("qrcodes");
const svgDir = path.join(outputDir, "svg");

await fs.mkdir(svgDir, { recursive: true });

const rows = [];

for (const posto of postosBase) {
  const fileName = `${posto.codigo}-${slugify(posto.nome)}.svg`;
  const filePath = path.join(svgDir, fileName);
  const svg = await QRCode.toString(posto.codigo, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
    color: {
      dark: "#102734",
      light: "#ffffff"
    }
  });

  await fs.writeFile(filePath, svg, "utf8");
  rows.push({ ...posto, fileName });
}

await fs.writeFile(path.join(outputDir, "print.html"), buildPrintPage(rows), "utf8");
await fs.writeFile(
  path.join(outputDir, "lista-qrcodes.csv"),
  ["codigo;posto;arquivo", ...rows.map((posto) => `${posto.codigo};${posto.nome};svg/${posto.fileName}`)].join("\n"),
  "utf8"
);

console.log(`QR Codes gerados em ${outputDir}`);

function buildPrintPage(postos) {
  const cards = postos
    .map(
      (posto) => `
        <article class="label">
          <img src="svg/${posto.fileName}" alt="QR Code ${posto.codigo}">
          <strong>${posto.codigo}</strong>
          <span>${posto.nome}</span>
        </article>`
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>QR Codes dos Postos</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16mm;
        color: #17212f;
        font-family: Arial, sans-serif;
      }
      h1 {
        margin: 0 0 12mm;
        font-size: 18pt;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 58mm);
        gap: 7mm;
      }
      .label {
        display: grid;
        min-height: 72mm;
        align-content: start;
        justify-items: center;
        padding: 5mm;
        border: 1px solid #cfd8e3;
        border-radius: 2mm;
        break-inside: avoid;
        text-align: center;
      }
      .label img {
        width: 40mm;
        height: 40mm;
      }
      .label strong {
        margin-top: 3mm;
        font-size: 15pt;
      }
      .label span {
        margin-top: 1mm;
        font-size: 9pt;
      }
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { padding: 0; }
        h1 { display: none; }
      }
    </style>
  </head>
  <body>
    <h1>QR Codes dos Postos</h1>
    <main class="grid">${cards}
    </main>
  </body>
</html>`;
}
