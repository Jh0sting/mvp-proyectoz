import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerarPlanos } from "@/components/GenerarPlanos";
import { nombrePiso, svgPlanta } from "@/lib/planos/dibujar";
import { resumenRespuestas, terrenoDe } from "@/lib/planos/requisitos";
import { obtenerSolicitud } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SolicitudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obtenerSolicitud(id);
  if (!s) notFound();
  const r = s.respuestas;
  const terreno = terrenoDe(r);
  const planos = s.planos;
  const errores = planos?.problemas.filter((p) => p.gravedad === "error") ?? [];
  const avisos = planos?.problemas.filter((p) => p.gravedad === "aviso") ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/admin" className="text-sm text-teal-800 underline">
        ← Solicitudes
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{String(r.contacto_nombre ?? "Sin nombre")}</h1>
          <p className="mt-1 text-stone-600">
            {String(r.distrito)} · terreno {terreno.frente} × {terreno.fondo} m ({terreno.area} m²) · WhatsApp {String(r.contacto_whatsapp ?? "")} ·{" "}
            {String(r.contacto_email ?? "")}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {planos && (
            <a
              href={`/api/admin/solicitudes/${id}/planos/pdf`}
              target="_blank"
              className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800"
            >
              Descargar PDF
            </a>
          )}
          <GenerarPlanos id={id} regenerar={Boolean(planos)} />
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="min-w-0 space-y-6">
          {!planos ? (
            <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-600">
              Esta solicitud todavía no tiene planos. Usa “Generar planos con IA” para crear una primera propuesta.
            </p>
          ) : (
            <>
              {(errores.length > 0 || avisos.length > 0) && (
                <div className="space-y-3">
                  {errores.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                      <p className="font-semibold">
                        La IA no logró resolver {errores.length} {errores.length === 1 ? "regla" : "reglas"} después de {planos.intentos} intentos. Revisa antes de enviar:
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {errores.map((p) => (
                          <li key={p.mensaje}>{p.mensaje}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {avisos.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">Para revisar</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {avisos.map((p) => (
                          <li key={p.mensaje}>{p.mensaje}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {[...planos.diseno.plantas]
                .sort((a, b) => a.nivel - b.nivel)
                .map((pl) => (
                  <figure key={pl.nivel} className="rounded-lg border border-stone-200 bg-white p-4">
                    <figcaption className="mb-3 font-semibold">{nombrePiso(pl.nivel)}</figcaption>
                    <div className="mx-auto max-w-xl [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svgPlanta(terreno, pl) }} />
                  </figure>
                ))}
            </>
          )}
        </section>

        <aside className="min-w-0 space-y-6">
          {planos && (
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <h2 className="font-semibold">Decisiones de diseño</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-stone-700">
                {planos.diseno.notas.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-500">
                Generado el {new Date(planos.generadoEn).toLocaleString("es-PE", { timeZone: "America/Lima" })} · {planos.intentos}{" "}
                {planos.intentos === 1 ? "intento" : "intentos"}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="font-semibold">Respuestas del formulario</h2>
            <pre className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-stone-700" style={{ fontFamily: "inherit" }}>
              {resumenRespuestas(r)}
            </pre>
          </div>
        </aside>
      </div>
    </main>
  );
}
