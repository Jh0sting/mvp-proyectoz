"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Answers, Member, Value } from "@/lib/form/schema";
import { buildSteps, scopeOf, visibleFields } from "@/lib/form/steps";
import { type Errors, validateStep } from "@/lib/form/validate";
import { FieldInput } from "./FieldInput";

const DRAFT_KEY = "proyectoz.formulario.borrador";

type Draft = { answers: Answers; stepKey?: string };

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // Sin almacenamiento local el formulario sigue funcionando, solo no se recupera al recargar.
  }
}

export function Wizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = useMemo(() => buildSteps(answers), [answers]);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setAnswers(d.answers);
      const i = buildSteps(d.answers).findIndex((s) => s.key === d.stepKey);
      if (i > 0) setIndex(i);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveDraft({ answers, stepKey: step.key });
  }, [answers, step.key, loaded]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step.key]);

  const onChange = (id: string, value: Value) => {
    setErrors((e) => ({ ...e, [id.replace(/_otro$/, "")]: "" }));
    setAnswers((a) => {
      if (step.kind === "root") return { ...a, [id]: value };
      const integrantes = [...(a.integrantes ?? [])];
      integrantes[step.index] = { ...(integrantes[step.index] ?? {}), [id]: value } as Member;
      return { ...a, integrantes };
    });
  };

  const next = async () => {
    const e = validateStep(step, answers);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    if (!isLast) {
      setIndex((i) => i + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (res.status === 422 && data.paso) {
        const i = steps.findIndex((s) => s.key === data.paso);
        if (i >= 0) setIndex(i);
        setErrors(data.errores ?? {});
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Error");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      router.push(`/gracias/${data.id}`);
    } catch {
      setSendError("No pudimos enviar tus respuestas. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const back = () => {
    setErrors({});
    setIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0 });
  };

  if (!loaded) return null;

  const title = step.kind === "root" ? step.section.title : step.title;
  const help = step.kind === "root" ? step.section.help : step.help;
  const note = step.kind === "root" ? step.section.note : undefined;
  const number = step.kind === "root" ? step.section.number : undefined;
  const scope = scopeOf(step, answers);
  const fields = visibleFields(step, answers);
  const progress = Math.round(((index + 1) / steps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm text-stone-600">
          <span>
            Paso {index + 1} de {steps.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200" aria-hidden>
          <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        className="space-y-6"
      >
        <header className="space-y-2">
          {number && <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Pregunta {number} de 20</p>}
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-stone-900 outline-none sm:text-3xl">
            {title}
          </h1>
          {help && <p className="text-stone-600">{help}</p>}
        </header>

        <div className="space-y-6">
          {fields.map((f) => (
            <FieldInput key={`${step.key}.${f.id}`} field={f} scope={scope} error={errors[f.id]} onChange={onChange} />
          ))}
        </div>

        {note && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{note}</p>}
        {sendError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {sendError}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={back}
            disabled={index === 0}
            className="rounded-lg px-4 py-3 font-medium text-stone-700 hover:bg-stone-100 disabled:invisible"
          >
            ← Atrás
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {isLast ? (sending ? "Enviando…" : "Enviar respuestas") : "Siguiente →"}
          </button>
        </div>
      </form>
    </div>
  );
}
