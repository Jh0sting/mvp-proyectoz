import type { Answers, Field, Member, Scope, Value } from "./schema";
import { buildSteps, memberCount, scopeOf, type Step, visibleFields } from "./steps";

export type Errors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isEmpty = (v: unknown) => v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/** Clave del texto "Otro: ____" asociado a un campo. */
export const otroKey = (fieldId: string) => `${fieldId}_otro`;

export function validateField(f: Field<Answers> | Field<Member>, scope: Scope): string | undefined {
  const v = scope[f.id];
  if (isEmpty(v)) return f.required ? "Este campo es obligatorio." : undefined;

  switch (f.kind) {
    case "number": {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return "Ingresa un número.";
      if (f.integer && !Number.isInteger(n)) return "Ingresa un número entero.";
      if (f.min !== undefined && n < f.min) return `El mínimo es ${f.min}.`;
      if (f.max !== undefined && n > f.max) return `El máximo es ${f.max}.`;
      return;
    }
    case "text": {
      const s = String(v).trim();
      if (f.required && !s) return "Este campo es obligatorio.";
      if (s.length > 500) return "Máximo 500 caracteres.";
      if (f.format === "email" && !EMAIL.test(s)) return "Ingresa un correo válido.";
      if (f.format === "phone" && s.replace(/\D/g, "").length < 9) return "Ingresa un número válido (mínimo 9 dígitos).";
      return;
    }
    case "time":
      return TIME.test(String(v)) ? undefined : "Ingresa una hora válida.";
    case "single": {
      const opt = f.options.find((o) => o.value === v);
      if (!opt) return "Elige una opción.";
      if (opt.otro && isEmpty(scope[otroKey(f.id)])) return "Cuéntanos cuál.";
      return;
    }
    case "multi": {
      if (!Array.isArray(v)) return "Elige al menos una opción.";
      const chosen = f.options.filter((o) => v.includes(o.value));
      if (chosen.length !== v.length) return "Hay una opción no válida.";
      if (f.max && v.length > f.max) return `Elige máximo ${f.max}.`;
      if (chosen.some((o) => o.exclusive) && v.length > 1) return "Esa opción no se puede combinar con otras.";
      if (chosen.some((o) => o.otro) && isEmpty(scope[otroKey(f.id)])) return "Cuéntanos cuál.";
      return;
    }
  }
}

export function validateStep(step: Step, a: Answers): Errors {
  const scope = scopeOf(step, a);
  const errors: Errors = {};
  for (const f of visibleFields(step, a)) {
    const e = validateField(f, scope);
    if (e) errors[f.id] = e;
  }
  return errors;
}

/** Valida todo el formulario. Devuelve el primer paso con errores, si lo hay. */
export function validateAll(a: Answers): { step: Step; errors: Errors } | null {
  for (const step of buildSteps(a)) {
    const errors = validateStep(step, a);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}

function pick(fields: (Field<Answers> | Field<Member>)[], scope: Scope): Member {
  const out: Member = {};
  for (const f of fields) {
    const v = scope[f.id];
    if (isEmpty(v)) continue;
    out[f.id] = f.kind === "number" ? Number(v) : typeof v === "string" ? v.trim() : (v as Value);
    const usesOtro =
      (f.kind === "single" && f.options.some((o) => o.otro && o.value === v)) ||
      (f.kind === "multi" && Array.isArray(v) && f.options.some((o) => o.otro && v.includes(o.value)));
    if (usesOtro) out[otroKey(f.id)] = String(scope[otroKey(f.id)] ?? "").trim();
  }
  return out;
}

/**
 * Deja solo las respuestas de campos visibles (descarta lo que quedó de
 * ramas que el usuario abrió y luego cambió) y normaliza números.
 */
export function cleanAnswers(a: Answers): Answers {
  const out: Answers = {};
  const integrantes: Member[] = [];
  for (const step of buildSteps(a)) {
    const picked = pick(visibleFields(step, a), scopeOf(step, a));
    if (step.kind === "root") Object.assign(out, picked);
    else integrantes[step.index] = picked;
  }
  if (memberCount(a) > 0) out.integrantes = integrantes;
  if (out.area_total === undefined && typeof out.frente === "number" && typeof out.fondo === "number") {
    out.area_total = Math.round(out.frente * out.fondo * 100) / 100;
  }
  return out;
}
