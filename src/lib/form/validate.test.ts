import { describe, expect, it } from "vitest";
import type { Answers } from "./schema";
import { buildSteps } from "./steps";
import { cleanAnswers, validateAll } from "./validate";

const completo = (): Answers => ({
  frente: 8,
  fondo: 20,
  distrito: "Surco",
  pisos: "2",
  licencia: "si",
  area_libre: "30",
  personas: "2",
  integrantes: [
    { edad: 35, dedicacion: "Ingeniero", ocupacion: "trabaja", lugar: "hibrido", espacio: "oficina", oficina_privada: "si" },
    { nombre: "Ana", edad: 33, relacion: "pareja", dedicacion: "Docente", ocupacion: "jubilado_a", espacio: "no" },
  ],
  visitantes: ["no"],
  frecuencia_visitas: "ocasionalmente",
  espacios_sociales: ["sala_amplia", "terraza"],
  cocina: "con_isla",
  obligatorios: ["dormitorio_principal_con_bano", "cochera"],
  vehiculos: "1",
  tipo_vehiculos: ["auto"],
  exteriores: ["patio"],
  mascotas: "no",
  privacidad: "poco_importante",
  iluminacion: "son_fundamentales",
  estilo: "contemporanea",
  prioridades: ["cochera"],
  sacrificios: ["piscina"],
  sensaciones: ["comodo"],
  contacto_nombre: "Juan Pérez",
  contacto_whatsapp: "987654321",
  contacto_email: "juan@example.com",
});

describe("formulario", () => {
  it("acepta un formulario completo", () => {
    expect(validateAll(cleanAnswers(completo()))).toBeNull();
  });

  it("genera una ficha por integrante", () => {
    const keys = buildSteps({ personas: "mas_6", personas_exacto: 8 }).map((s) => s.key);
    expect(keys.filter((k) => k.startsWith("integrante_"))).toHaveLength(8);
  });

  it("no pregunta la relación en la ficha de quien llena el formulario", () => {
    const steps = buildSteps({ personas: "2" }).filter((s) => s.kind === "member");
    const ids = steps.map((s) => (s.kind === "member" ? s.fields.map((f) => f.id) : []));
    expect(ids[0]).not.toContain("relacion");
    expect(ids[1]).toContain("relacion");
  });

  it("exige las preguntas adicionales cuando aplican", () => {
    const a = { ...completo(), exteriores: ["piscina"] };
    expect(validateAll(cleanAnswers(a))?.errors).toMatchObject({ piscina_importancia: expect.any(String) });
  });

  it("respeta el máximo de opciones", () => {
    const a = { ...completo(), espacios_sociales: ["sala_amplia", "terraza", "patio", "jardin"] };
    expect(validateAll(cleanAnswers(a))?.errors.espacios_sociales).toMatch(/máximo 3/);
  });

  it("pide el texto cuando se elige Otro", () => {
    const a = { ...completo(), estilo: "otro" };
    expect(validateAll(cleanAnswers(a))?.errors.estilo).toBeTruthy();
    expect(validateAll(cleanAnswers({ ...a, estilo_otro: "Mediterráneo" }))).toBeNull();
  });

  it("descarta respuestas de ramas que ya no aplican y calcula el área", () => {
    const a = cleanAnswers({ ...completo(), vehiculos: "0", mascotas_tipo: "perro" });
    expect(a.tipo_vehiculos).toBeUndefined();
    expect(a.mascotas_tipo).toBeUndefined();
    expect(a.area_total).toBe(160);
  });

  it("no combina Ninguno con otras opciones", () => {
    const a = { ...completo(), exteriores: ["ninguno", "patio"] };
    expect(validateAll(cleanAnswers(a))?.errors.exteriores).toBeTruthy();
  });
});
