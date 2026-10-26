import Link from "next/link";
import { listarSolicitudes } from "@/lib/storage";

export const dynamic = "force-dynamic";

const ESTADO = {
  recibida: { texto: "Sin planos", cls: "bg-amber-100 text-amber-900" },
  planos_generados: { texto: "Planos listos", cls: "bg-teal-100 text-teal-900" },
} as const;

export default async function AdminPage() {
  const solicitudes = await listarSolicitudes();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Solicitudes</h1>
      <p className="mt-1 text-stone-600">Formularios recibidos, del más reciente al más antiguo.</p>
      {solicitudes.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-stone-300 p-6 text-stone-600">
          Todavía no hay solicitudes. Aparecerán aquí cuando alguien envíe el formulario.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Distrito</th>
                <th className="px-4 py-3 font-medium">Terreno</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => {
                const r = s.respuestas;
                const e = ESTADO[s.estado];
                return (
                  <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {new Date(s.creadaEn).toLocaleDateString("es-PE", { timeZone: "America/Lima" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/${s.id}`} className="font-medium text-teal-800 underline">
                        {String(r.contacto_nombre ?? "Sin nombre")}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{String(r.distrito ?? "")}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {String(r.frente)} × {String(r.fondo)} m
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${e.cls}`}>{e.texto}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
