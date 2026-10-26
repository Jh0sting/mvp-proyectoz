import {
  type Answers,
  type Field,
  type Member,
  type Scope,
  type Section,
  memberSection,
  sectionsAfterMembers,
  sectionsBeforeMembers,
} from "./schema";

/** Un paso del asistente: una pregunta general o la ficha de un integrante. */
export type Step =
  | { key: string; kind: "root"; section: Section }
  | { key: string; kind: "member"; index: number; title: string; help?: string; fields: Field<Member>[] };

export const MAX_INTEGRANTES = 20;

export function memberCount(a: Answers): number {
  if (a.personas === "mas_6") {
    const n = Number(a.personas_exacto);
    return Number.isInteger(n) && n >= 7 ? Math.min(n, MAX_INTEGRANTES) : 0;
  }
  const n = Number(a.personas);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

// En la primera ficha (la de quien llena el formulario) las preguntas van en segunda persona.
const labelsTu: Record<string, string> = {
  edad: "¿Qué edad tienes?",
  dedicacion: "¿A qué te dedicas?",
  ocupacion: "¿Actualmente trabajas, estudias o ambas?",
  lugar: "¿Dónde realizas principalmente esta actividad?",
  espacio: "¿Necesitas algún espacio específico dentro de la vivienda para realizar tus actividades?",
  oficina_privada: "Como trabajas desde casa, ¿necesitas una oficina privada (cerrada y con puerta)?",
  espacio_estudio: "Como estudias, ¿necesitas un espacio propio para estudiar o hacer tareas?",
};

function memberFields(index: number): Field<Member>[] {
  if (index > 0) return memberSection.fields;
  return memberSection.fields
    .filter((f) => f.id !== "relacion" && f.id !== "nombre")
    .map((f) => (labelsTu[f.id] ? { ...f, label: labelsTu[f.id] } : f));
}

/** Lista de pasos visibles según lo respondido hasta ahora. */
export function buildSteps(a: Answers): Step[] {
  const steps: Step[] = sectionsBeforeMembers.map((s) => ({ key: s.id, kind: "root", section: s }));
  const n = memberCount(a);
  for (let i = 0; i < n; i++) {
    steps.push({
      key: `integrante_${i}`,
      kind: "member",
      index: i,
      title: i === 0 ? "Empecemos por ti" : `Integrante ${i + 1} de ${n}`,
      help: i === 0 ? "Cuéntanos sobre ti, la persona que llena este formulario." : memberSection.help,
      fields: memberFields(i),
    });
  }
  for (const s of sectionsAfterMembers) steps.push({ key: s.id, kind: "root", section: s });
  return steps;
}

export function visibleFields(step: Step, a: Answers): Field<Answers>[] | Field<Member>[] {
  if (step.kind === "root") return step.section.fields.filter((f) => !f.showIf || f.showIf(a, a));
  const m = a.integrantes?.[step.index] ?? {};
  return step.fields.filter((f) => !f.showIf || f.showIf(m, a));
}

export function scopeOf(step: Step, a: Answers): Scope {
  return step.kind === "root" ? a : (a.integrantes?.[step.index] ?? {});
}
