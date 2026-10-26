"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerarPlanos({ id, regenerar }: { id: string; regenerar: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"inactivo" | "generando">("inactivo");
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setEstado("generando");
    setError(null);
    try {
      const res = await fetch(`/api/admin/solicitudes/${id}/planos`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudieron generar los planos.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron generar los planos.");
    } finally {
      setEstado("inactivo");
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={generar}
        disabled={estado === "generando"}
        className={
          regenerar
            ? "rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-60"
            : "rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        }
      >
        {estado === "generando" ? "Generando planos…" : regenerar ? "Volver a generar" : "Generar planos con IA"}
      </button>
      {estado === "generando" && <p className="text-sm text-stone-600">Esto puede tardar entre 1 y 4 minutos. No cierres la página.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
