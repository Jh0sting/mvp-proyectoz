import type { Answers, Field, Member } from "../form/schema";
import { buildSteps, scopeOf, visibleFields } from "../form/steps";
import { otroKey } from "../form/validate";

/** Datos del terreno que el motor usa para dibujar y validar. */
export type Terreno = {
  frente: number;
  fondo: number;
  area: number;
  /** Porcentaje de área libre mínimo en el primer piso. */
  areaLibre: number;
  areaLibreRecomendada: boolean;
  /** Pisos pedidos, o null si el cliente quiere una recomendación. */
  pisos: number | null;
};

export const AREA_LIBRE_POR_DEFECTO = 30;
export const PISOS_MAXIMOS = 4;

export function terrenoDe(a: Answers): Terreno {
  const frente = Number(a.frente);
  const fondo = Number(a.fondo);
  const recomendada = a.area_libre === "recomendar" || a.area_libre === undefined;
  const pisos = a.pisos === "4_mas" ? PISOS_MAXIMOS : Number(a.pisos);
  return {
    frente,
    fondo,
    area: Number(a.area_total ?? frente * fondo),
    areaLibre: recomendada ? AREA_LIBRE_POR_DEFECTO : Number(a.area_libre),
    areaLibreRecomendada: recomendada,
    pisos: Number.isInteger(pisos) && pisos > 0 ? pisos : null,
  };
}

function texto(f: Field<Answers> | Field<Member>, scope: Record<string, unknown>): string | null {
  const v = scope[f.id];
  if (v === undefined || v === "") return null;
  const otro = scope[otroKey(f.id)];
  const etiqueta = (x: string) => {
    if (f.kind !== "single" && f.kind !== "multi") return x;
    const o = f.options.find((op) => op.value === x);
    if (!o) return x;
    return o.otro && otro ? `${o.label} (${otro})` : o.label;
  };
  if (Array.isArray(v)) return v.map((x) => etiqueta(String(x))).join(", ");
  if (f.kind === "number" && f.unit) return `${v} ${f.unit}`;
  return etiqueta(String(v));
}

/**
 * Resume las respuestas del formulario en texto legible, pregunta por
 * pregunta. Es lo que lee el modelo y también lo que ve el arquitecto.
 * Los datos de contacto no se incluyen.
 */
export function resumenRespuestas(a: Answers): string {
  const lineas: string[] = [];
  for (const step of buildSteps(a)) {
    if (step.kind === "root" && step.section.id === "contacto") continue;
    const scope = scopeOf(step, a);
    const items = visibleFields(step, a)
      .map((f) => {
        const t = texto(f, scope);
        return t ? `- ${f.label}${f.label.endsWith("?") ? "" : ":"} ${t}` : null;
      })
      .filter(Boolean);
    if (!items.length) continue;
    const titulo =
      step.kind === "root"
        ? `${step.section.number ? `${step.section.number}. ` : ""}${step.section.title}`
        : step.index === 0
          ? "Integrante 1 (quien llena el formulario)"
          : `Integrante ${step.index + 1}`;
    lineas.push(`${titulo}\n${items.join("\n")}`);
  }
  return lineas.join("\n\n");
}
