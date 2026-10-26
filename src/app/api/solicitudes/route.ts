import { NextResponse } from "next/server";
import type { Answers } from "@/lib/form/schema";
import { cleanAnswers, validateAll } from "@/lib/form/validate";
import { crearSolicitud } from "@/lib/storage";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const answers = cleanAnswers(body as Answers);
  const invalid = validateAll(answers);
  if (invalid) {
    return NextResponse.json({ error: "Respuestas incompletas", paso: invalid.step.key, errores: invalid.errors }, { status: 422 });
  }

  const s = await crearSolicitud(answers);
  return NextResponse.json({ id: s.id }, { status: 201 });
}
