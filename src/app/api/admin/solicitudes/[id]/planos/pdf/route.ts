import { pdfAnteproyecto } from "@/lib/planos/pdf";
import { terrenoDe } from "@/lib/planos/requisitos";
import { obtenerSolicitud } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obtenerSolicitud(id);
  if (!s?.planos) return new Response("Esta solicitud todavía no tiene planos.", { status: 404 });

  const pdf = await pdfAnteproyecto(s.planos.diseno, terrenoDe(s.respuestas), {
    distrito: String(s.respuestas.distrito ?? ""),
    solicitud: id.slice(0, 8),
    fecha: new Date(s.planos.generadoEn).toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="anteproyecto-${id.slice(0, 8)}.pdf"`,
    },
  });
}
