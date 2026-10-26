import { describe, expect, it } from "vitest";
import { disenoEjemplo, respuestasEjemplo } from "./__fixtures__/ejemplo";
import { svgPlanta } from "./dibujar";
import { escalaPara, pdfAnteproyecto } from "./pdf";
import { resumenRespuestas, terrenoDe } from "./requisitos";
import type { Diseno } from "./tipos";
import { validarDiseno } from "./validar";

const terreno = terrenoDe(respuestasEjemplo);
const copia = (): Diseno => structuredClone(disenoEjemplo);
const errores = (d: Diseno) => validarDiseno(d, terreno, respuestasEjemplo).filter((p) => p.gravedad === "error");

describe("validación del diseño", () => {
  it("acepta el diseño de ejemplo sin errores ni avisos", () => {
    expect(validarDiseno(disenoEjemplo, terreno, respuestasEjemplo)).toEqual([]);
  });

  it("detecta ambientes fuera del terreno", () => {
    const d = copia();
    d.plantas[0].ambientes[0].x = 6;
    expect(errores(d).map((e) => e.mensaje).join()).toMatch(/se sale del terreno/);
  });

  it("detecta superposiciones", () => {
    const d = copia();
    d.plantas[0].ambientes[2].y = 1;
    expect(errores(d).map((e) => e.mensaje).join()).toMatch(/se superponen/);
  });

  it("exige el área libre del primer piso", () => {
    const d = copia();
    d.plantas[0].ambientes.find((a) => a.id === "p1_patio")!.tipo = "terraza";
    expect(errores(d).map((e) => e.mensaje).join()).toMatch(/área libre/);
  });

  it("exige que la escalera coincida entre pisos", () => {
    const d = copia();
    d.plantas[1].ambientes.find((a) => a.tipo === "escalera")!.y = 0.5;
    expect(errores(d).map((e) => e.mensaje).join()).toMatch(/escalera del piso 2 no coincide/);
  });

  it("detecta ambientes de piso alto sin apoyo", () => {
    const d = copia();
    d.plantas[1].ambientes.push({ id: "x", nombre: "VOLADO", tipo: "deposito", x: 0, y: 16, ancho: 2, largo: 2 });
    expect(errores(d).map((e) => e.mensaje).join()).toMatch(/queda en el aire/);
  });

  it("avisa cuando un dormitorio no tiene luz natural", () => {
    const d = copia();
    const est = d.plantas[1].ambientes.find((a) => a.id === "p2_estudio")!;
    est.tipo = "dormitorio";
    d.plantas[1].ambientes = d.plantas[1].ambientes.filter((a) => a.tipo !== "terraza");
    d.plantas[1].ambientes.push(
      { id: "t", nombre: "DEPÓSITO", tipo: "deposito", x: 0, y: 10, ancho: 8, largo: 4.5 },
      { id: "t2", nombre: "DEPÓSITO 2", tipo: "deposito", x: 2.6, y: 8.3, ancho: 1.2, largo: 1.7 },
    );
    const avisos = validarDiseno(d, terreno, respuestasEjemplo).filter((p) => p.gravedad === "aviso");
    expect(avisos.map((a) => a.mensaje).join()).toMatch(/ESTUDIO no tiene ningún lado/);
  });
});

describe("dibujo y PDF", () => {
  it("resume las respuestas sin datos de contacto", () => {
    const r = resumenRespuestas({ ...respuestasEjemplo, contacto_nombre: "Ana", contacto_email: "a@b.pe" });
    expect(r).toContain("Distrito: Santiago de Surco");
    expect(r).toContain("Integrante 2");
    expect(r).not.toContain("a@b.pe");
  });

  it("dibuja cada planta con sus ambientes", () => {
    const svg = svgPlanta(terreno, disenoEjemplo.plantas[0]);
    expect(svg).toContain("SALA-COMEDOR");
    expect(svg).toContain("8.00 m");
  });

  it("elige la escala estándar más grande que entra en A3", () => {
    expect(escalaPara({ ...terreno, frente: 6, fondo: 12 })).toBe(50);
    expect(escalaPara(terreno)).toBe(75);
    expect(escalaPara({ ...terreno, frente: 15, fondo: 40 })).toBe(150);
  });

  it("genera un PDF con una lámina por piso", async () => {
    const pdf = await pdfAnteproyecto(disenoEjemplo, terreno, { distrito: "Surco", solicitud: "abc", fecha: "26/10/2026" });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(2);
  });
});
