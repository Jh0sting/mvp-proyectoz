import PDFDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";
import type { Terreno } from "./requisitos";
import { DESCUBIERTOS, type Diseno } from "./tipos";
import { nombrePiso, svgPlanta, tamanoDibujo } from "./dibujar";
import { area } from "./validar";

const MM = 72 / 25.4; // puntos por milímetro
const A3 = { ancho: 297, alto: 420 }; // mm, vertical
const MARGEN = 12;
const CARTELA = 62;
const ESCALAS = [50, 75, 100, 125, 150, 200];

/** La escala estándar más grande (1/50, 1/75, …) con la que la planta entra en la hoja. */
export function escalaPara(t: Terreno): number {
  const { ancho, alto } = tamanoDibujo(t);
  const disponible = { ancho: A3.ancho - 2 * MARGEN, alto: A3.alto - 2 * MARGEN - CARTELA - 6 };
  return ESCALAS.find((e) => (ancho * 1000) / e <= disponible.ancho && (alto * 1000) / e <= disponible.alto) ?? ESCALAS.at(-1)!;
}

export type DatosLamina = { distrito: string; solicitud: string; fecha: string };

/** PDF del anteproyecto: una lámina A3 por piso, a escala, con cartela y cuadro de áreas. */
export function pdfAnteproyecto(diseno: Diseno, t: Terreno, datos: DatosLamina): Promise<Buffer> {
  const doc = new PDFDocument({ size: [A3.ancho * MM, A3.alto * MM], margin: 0, info: { Title: "Anteproyecto", Author: "Proyecto Z" } });
  const partes: Buffer[] = [];
  doc.on("data", (b: Buffer) => partes.push(b));
  const listo = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(partes))));

  const escala = escalaPara(t);
  const { ancho, alto } = tamanoDibujo(t);
  const plantas = [...diseno.plantas].sort((a, b) => a.nivel - b.nivel);
  const techada = (n: number) =>
    plantas.find((p) => p.nivel === n)?.ambientes.filter((a) => !DESCUBIERTOS.has(a.tipo)).reduce((s, a) => s + area(a), 0) ?? 0;
  const libre = ((t.area - techada(1)) / t.area) * 100;
  const total = plantas.reduce((s, p) => s + techada(p.nivel), 0);

  plantas.forEach((planta, i) => {
    if (i > 0) doc.addPage();
    // Planta centrada en el área de dibujo
    const w = ((ancho * 1000) / escala) * MM;
    const h = ((alto * 1000) / escala) * MM;
    const areaDibujo = { ancho: (A3.ancho - 2 * MARGEN) * MM, alto: (A3.alto - 2 * MARGEN - CARTELA) * MM };
    SVGtoPDF(doc, svgPlanta(t, planta), MARGEN * MM + (areaDibujo.ancho - w) / 2, MARGEN * MM + (areaDibujo.alto - h) / 2, { width: w, height: h });

    // Marco y cartela
    const x0 = MARGEN * MM;
    const y0 = (A3.alto - MARGEN - CARTELA) * MM;
    const W = (A3.ancho - 2 * MARGEN) * MM;
    const H = CARTELA * MM;
    doc.lineWidth(0.8).strokeColor("#1f2a2c").rect(x0, MARGEN * MM, W, (A3.alto - 2 * MARGEN) * MM).stroke();
    doc.lineWidth(0.6).moveTo(x0, y0).lineTo(x0 + W, y0).stroke();
    const col1 = x0 + W * 0.42;
    const col2 = x0 + W * 0.72;
    doc.moveTo(col1, y0).lineTo(col1, y0 + H).stroke();
    doc.moveTo(col2, y0).lineTo(col2, y0 + H).stroke();

    const pad = 4 * MM;
    doc.fillColor("#1f2a2c").font("Helvetica-Bold").fontSize(15).text(nombrePiso(planta.nivel), x0 + pad, y0 + pad, { width: col1 - x0 - 2 * pad });
    doc.font("Helvetica").fontSize(9).text(`ESCALA 1/${escala}`, { width: col1 - x0 - 2 * pad });
    doc.moveDown(0.8).fontSize(8).fillColor("#5b6668").text(`ANTEPROYECTO · VIVIENDA UNIFAMILIAR`, { width: col1 - x0 - 2 * pad });
    doc.text(`Distrito: ${datos.distrito}`);
    doc.text(`Solicitud ${datos.solicitud} · ${datos.fecha}`);
    doc.moveDown(0.6).fontSize(7).text("Documento preliminar generado con IA y revisado por arquitecto. No apto para construcción ni para trámite de licencia.", {
      width: col1 - x0 - 2 * pad,
    });

    // Cuadro de áreas
    doc.fillColor("#1f2a2c").font("Helvetica-Bold").fontSize(8).text("CUADRO DE ÁREAS", col1 + pad, y0 + pad);
    doc.font("Helvetica").fontSize(8);
    const filas: [string, string][] = [
      ["Terreno", `${t.frente.toFixed(2)} × ${t.fondo.toFixed(2)} m`],
      ["Área de terreno", `${t.area.toFixed(2)} m²`],
      ...plantas.map((p): [string, string] => [`Techada ${p.nivel}° piso`, `${techada(p.nivel).toFixed(2)} m²`]),
      ["Área techada total", `${total.toFixed(2)} m²`],
      ["Área libre (1° piso)", `${libre.toFixed(1)} %`],
    ];
    let y = y0 + pad + 14;
    for (const [k, v] of filas) {
      doc.text(k, col1 + pad, y, { width: (col2 - col1) / 2 });
      doc.text(v, col1 + (col2 - col1) / 2, y, { width: (col2 - col1) / 2 - pad, align: "right" });
      y += 11;
    }

    // Lista de ambientes de este piso
    doc.font("Helvetica-Bold").text("AMBIENTES", col2 + pad, y0 + pad);
    doc.font("Helvetica").fontSize(7);
    y = y0 + pad + 13;
    for (const a of planta.ambientes) {
      if (y > y0 + H - 10) break;
      doc.text(a.nombre, col2 + pad, y, { width: (x0 + W - col2) * 0.62 });
      doc.text(`${area(a).toFixed(2)} m²`, col2 + (x0 + W - col2) * 0.62, y, { width: (x0 + W - col2) * 0.38 - pad, align: "right" });
      y += 9;
    }
  });

  doc.end();
  return listo;
}
