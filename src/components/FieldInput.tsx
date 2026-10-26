"use client";

import type { Answers, Field, Member, Scope, Value } from "@/lib/form/schema";
import { otroKey } from "@/lib/form/validate";

type Props = {
  field: Field<Answers> | Field<Member>;
  scope: Scope;
  error?: string;
  onChange: (id: string, value: Value) => void;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";

export function FieldInput({ field: f, scope, error, onChange }: Props) {
  const v = scope[f.id];
  const id = `f_${f.id}`;

  let control: React.ReactNode;
  switch (f.kind) {
    case "number":
      control = (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={f.integer ? 1 : "any"}
            min={f.min}
            max={f.max}
            className={`${inputCls} max-w-40`}
            value={v === undefined ? "" : String(v)}
            onChange={(e) => onChange(f.id, e.target.value === "" ? undefined : e.target.value)}
          />
          {f.unit && <span className="text-stone-600">{f.unit}</span>}
        </div>
      );
      break;
    case "text":
      control = f.multiline ? (
        <textarea
          id={id}
          rows={3}
          maxLength={500}
          className={inputCls}
          placeholder={f.placeholder}
          value={(v as string) ?? ""}
          onChange={(e) => onChange(f.id, e.target.value)}
        />
      ) : (
        <input
          id={id}
          type={f.format === "email" ? "email" : f.format === "phone" ? "tel" : "text"}
          maxLength={500}
          className={inputCls}
          placeholder={f.placeholder}
          value={(v as string) ?? ""}
          onChange={(e) => onChange(f.id, e.target.value)}
        />
      );
      break;
    case "time":
      control = (
        <input
          id={id}
          type="time"
          className={`${inputCls} max-w-40`}
          value={(v as string) ?? ""}
          onChange={(e) => onChange(f.id, e.target.value || undefined)}
        />
      );
      break;
    case "single":
    case "multi": {
      const multi = f.kind === "multi";
      const selected: string[] = multi ? (Array.isArray(v) ? (v as string[]) : []) : v ? [String(v)] : [];
      const full = multi && f.max !== undefined && selected.length >= f.max;
      const toggle = (value: string) => {
        if (!multi) return onChange(f.id, value);
        const opt = f.options.find((o) => o.value === value)!;
        if (selected.includes(value)) return onChange(f.id, selected.filter((x) => x !== value));
        const exclusives = new Set(f.options.filter((o) => o.exclusive).map((o) => o.value));
        const rest = opt.exclusive ? [] : selected.filter((x) => !exclusives.has(x));
        if (f.max !== undefined && rest.length >= f.max) return;
        onChange(f.id, [...rest, value]);
      };
      const showsOtro = f.options.some((o) => o.otro && selected.includes(o.value));
      control = (
        <div>
          <div role={multi ? "group" : "radiogroup"} aria-labelledby={`${id}_label`} className="grid gap-2 sm:grid-cols-2">
            {f.options.map((o) => {
              const on = selected.includes(o.value);
              const disabled = !on && full && !o.exclusive;
              return (
                <button
                  key={o.value}
                  type="button"
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={on}
                  disabled={disabled}
                  onClick={() => toggle(o.value)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-base transition ${
                    on
                      ? "border-teal-700 bg-teal-50 text-teal-950"
                      : "border-stone-300 bg-white text-stone-800 hover:border-stone-400"
                  } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border ${multi ? "rounded" : "rounded-full"} ${
                      on ? "border-teal-700 bg-teal-700 text-white" : "border-stone-400"
                    }`}
                  >
                    {on && (multi ? "✓" : <span className="h-2 w-2 rounded-full bg-white" />)}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
          {multi && f.max !== undefined && (
            <p className="mt-2 text-sm text-stone-500">
              {selected.length} de {f.max} seleccionadas
            </p>
          )}
          {showsOtro && (
            <input
              aria-label="Otro, especifica"
              className={`${inputCls} mt-3`}
              maxLength={200}
              placeholder="Otro: ¿cuál?"
              value={(scope[otroKey(f.id)] as string) ?? ""}
              onChange={(e) => onChange(otroKey(f.id), e.target.value)}
            />
          )}
        </div>
      );
      break;
    }
  }

  return (
    <div className="space-y-2">
      <label id={`${id}_label`} htmlFor={id} className="block font-medium text-stone-900">
        {f.label}
        {!f.required && <span className="font-normal text-stone-500"> (opcional)</span>}
      </label>
      {f.help && <p className="text-sm text-stone-600">{f.help}</p>}
      {control}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
