import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generarPlanos, PlanosError } from "@/lib/planos/generar";
import { guardarPlanos, obtenerSolicitud } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obtenerSolicitud(id);
  if (!s) return NextResponse.json({ error: "No existe esa solicitud." }, { status: 404 });

  try {
    const planos = await generarPlanos(s.respuestas);
    await guardarPlanos(id, planos);
    return NextResponse.json(planos);
  } catch (e) {
    if (e instanceof PlanosError) return NextResponse.json({ error: e.message }, { status: 502 });
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "La clave de la API de Claude no es válida. Revisa ANTHROPIC_API_KEY." }, { status: 500 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Se alcanzó el límite de uso de la API de Claude. Intenta en unos minutos." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Error de la API de Claude: ${e.message}` }, { status: 502 });
    }
    if (e instanceof Error && /api ?key|apiKey|authToken/i.test(e.message)) {
      return NextResponse.json({ error: "Falta configurar ANTHROPIC_API_KEY en el servidor." }, { status: 500 });
    }
    throw e;
  }
}
