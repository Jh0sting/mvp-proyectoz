import type { Terreno } from "./requisitos";
import { type Ambiente, DESCUBIERTOS, type Planta, type TipoAmbiente } from "./tipos";
import { area } from "./validar";

// Dibuja una planta como SVG en metros (1 unidad = 1 m). La calle queda
// abajo, como se acostumbra en los planos de vivienda.

const MARGEN = { izq: 1.6, der: 0.6, arriba: 0.6, abajo: 2.0 };
const MURO = 0.15;

const RELLENO: Partial<Record<TipoAmbiente, string>> = {
  sala: "#f3ede2",
  comedor: "#f3ede2",
  sala_comedor: "#f3ede2",
  sala_tv: "#f3ede2",
  cocina: "#efe6d6",
  bano: "#e3edf0",
  medio_bano: "#e3edf0",
  lavanderia: "#e3edf0",
  patio: "#e5efe0",
  jardin: "#dcebd4",
  piscina: "#d3e7ef",
  terraza: "#ecefe6",
  parrilla: "#ecefe6",
  cochera: "#ebebeb",
  circulacion: "#ffffff",
  escalera: "#ffffff",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f2 = (n: number) => n.toFixed(2);

export function nombrePiso(nivel: number): string {
  return `PLANTA ${nivel}° PISO`;
}

export function tamanoDibujo(t: Terreno): { ancho: number; alto: number } {
  return { ancho: t.frente + MARGEN.izq + MARGEN.der, alto: t.fondo + MARGEN.arriba + MARGEN.abajo };
}

function escalera(a: Ambiente, Y: (y: number) => number): string {
  // Peldaños de 0.25 m en el sentido largo, con flecha de subida.
  const vertical = a.largo >= a.ancho;
  const lineas: string[] = [];
  const largo = vertical ? a.largo : a.ancho;
  for (let s = 0.25; s < largo - 0.01; s += 0.25) {
    if (vertical) lineas.push(`<line x1="${f2(a.x)}" y1="${f2(Y(a.y + s))}" x2="${f2(a.x + a.ancho)}" y2="${f2(Y(a.y + s))}"/>`);
    else lineas.push(`<line x1="${f2(a.x + s)}" y1="${f2(Y(a.y))}" x2="${f2(a.x + s)}" y2="${f2(Y(a.y + a.largo))}"/>`);
  }
  return `<g stroke="#8a8a8a" stroke-width="0.02">${lineas.join("")}</g>`;
}

function etiqueta(a: Ambiente, Y: (y: number) => number): string {
  const cx = a.x + a.ancho / 2;
  const cy = Y(a.y + a.largo / 2);
  // En ambientes angostos y largos (pasadizos) el texto va girado.
  const girar = a.ancho < 1.6 && a.largo > a.ancho * 2;
  const [w, h] = girar ? [a.largo, a.ancho] : [a.ancho, a.largo];
  // El texto se achica en ambientes chicos para que no se salga.
  const t = Math.max(0.1, Math.min(0.26, w / (a.nombre.length * 0.68), h / 3.4));
  const detalle = `${f2(area(a))} m²`;
  const medidas = `${f2(a.ancho)} × ${f2(a.largo)}`;
  const rot = girar ? ` transform="rotate(-90 ${f2(cx)} ${f2(cy)})"` : "";
  return `<g font-family="Helvetica, Arial, sans-serif" text-anchor="middle" fill="#1f2a2c"${rot}>
<text x="${f2(cx)}" y="${f2(cy - t * 0.35)}" font-size="${f2(t)}" font-weight="bold">${esc(a.nombre)}</text>
<text x="${f2(cx)}" y="${f2(cy + t * 0.85)}" font-size="${f2(t * 0.78)}">${detalle}</text>
<text x="${f2(cx)}" y="${f2(cy + t * 1.85)}" font-size="${f2(t * 0.7)}" fill="#5b6668">${medidas}</text>
</g>`;
}

function cota(x1: number, y1: number, x2: number, y2: number, texto: string, vertical: boolean): string {
  const tick = 0.15;
  const ticks = vertical
    ? `<line x1="${f2(x1 - tick)}" y1="${f2(y1)}" x2="${f2(x1 + tick)}" y2="${f2(y1)}"/><line x1="${f2(x2 - tick)}" y1="${f2(y2)}" x2="${f2(x2 + tick)}" y2="${f2(y2)}"/>`
    : `<line x1="${f2(x1)}" y1="${f2(y1 - tick)}" x2="${f2(x1)}" y2="${f2(y1 + tick)}"/><line x1="${f2(x2)}" y1="${f2(y2 - tick)}" x2="${f2(x2)}" y2="${f2(y2 + tick)}"/>`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const txt = vertical
    ? `<text x="${f2(mx - 0.18)}" y="${f2(my)}" transform="rotate(-90 ${f2(mx - 0.18)} ${f2(my)})" text-anchor="middle" font-size="0.24">${texto}</text>`
    : `<text x="${f2(mx)}" y="${f2(my - 0.18)}" text-anchor="middle" font-size="0.24">${texto}</text>`;
  return `<g stroke="#1f2a2c" stroke-width="0.02" fill="#1f2a2c" font-family="Helvetica, Arial, sans-serif"><line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}"/>${ticks}<g stroke="none">${txt}</g></g>`;
}

/** SVG de una planta. `planta` es null para dibujar solo el terreno. */
export function svgPlanta(t: Terreno, planta: Planta | null, opciones: { anchoPx?: number } = {}): string {
  const { ancho, alto } = tamanoDibujo(t);
  const Y = (y: number) => t.fondo - y; // la calle (y = 0) abajo
  const ambientes = planta?.ambientes ?? [];
  // Patios, jardines, piscinas y terrazas se dibujan con línea fina punteada; el resto con muro.
  const abierto = (a: Ambiente) => DESCUBIERTOS.has(a.tipo) || a.tipo === "terraza";
  const cubiertos = ambientes.filter((a) => !abierto(a));
  const descubiertos = ambientes.filter(abierto);

  const rect = (a: Ambiente, extra: string) =>
    `<rect x="${f2(a.x)}" y="${f2(Y(a.y + a.largo))}" width="${f2(a.ancho)}" height="${f2(a.largo)}" ${extra}/>`;

  const contenido = [
    // Terreno y calle
    `<rect x="0" y="0" width="${f2(t.frente)}" height="${f2(t.fondo)}" fill="#fbfaf7" stroke="#7a8486" stroke-width="0.03" stroke-dasharray="0.3 0.15"/>`,
    `<line x1="-0.6" y1="${f2(t.fondo + 0.35)}" x2="${f2(t.frente + 0.6)}" y2="${f2(t.fondo + 0.35)}" stroke="#7a8486" stroke-width="0.02"/>`,
    `<text x="${f2(t.frente / 2)}" y="${f2(t.fondo + 0.75)}" text-anchor="middle" font-size="0.26" letter-spacing="0.08" font-family="Helvetica, Arial, sans-serif" fill="#5b6668">CALLE</text>`,
    // Ambientes descubiertos (línea fina punteada) y techados (muro grueso)
    ...descubiertos.map((a) => rect(a, `fill="${RELLENO[a.tipo] ?? "#eef2ea"}" stroke="#7a9a73" stroke-width="0.04" stroke-dasharray="0.2 0.1"`)),
    ...cubiertos.map((a) => rect(a, `fill="${RELLENO[a.tipo] ?? "#ffffff"}" stroke="none"`)),
    ...cubiertos.filter((a) => a.tipo === "escalera").map((a) => escalera(a, Y)),
    ...cubiertos.map((a) => rect(a, `fill="none" stroke="#1f2a2c" stroke-width="${MURO}" stroke-linejoin="miter"`)),
    ...ambientes.map((a) => etiqueta(a, Y)),
    // Cotas generales
    cota(0, t.fondo + 1.35, t.frente, t.fondo + 1.35, `${f2(t.frente)} m`, false),
    cota(-1.0, 0, -1.0, t.fondo, `${f2(t.fondo)} m`, true),
  ];

  const w = opciones.anchoPx ? ` width="${opciones.anchoPx}" height="${Math.round((opciones.anchoPx * alto) / ancho)}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(-MARGEN.izq)} ${f2(-MARGEN.arriba)} ${f2(ancho)} ${f2(alto)}"${w}>${contenido.join("\n")}</svg>`;
}
