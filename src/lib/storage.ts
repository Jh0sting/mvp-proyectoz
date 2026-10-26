import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Answers } from "./form/schema";

export type Solicitud = {
  id: string;
  creadaEn: string;
  estado: "recibida";
  respuestas: Answers;
};

// Guardado en archivos JSON: suficiente para el MVP y el piloto en un
// servidor propio. Para desplegar en un hosting sin disco persistente
// (p. ej. Vercel) hay que cambiar esta capa por una base de datos.
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data", "solicitudes");

const fileFor = (id: string) => {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("id inválido");
  return path.join(DATA_DIR, `${id}.json`);
};

export async function crearSolicitud(respuestas: Answers): Promise<Solicitud> {
  const s: Solicitud = { id: randomUUID(), creadaEn: new Date().toISOString(), estado: "recibida", respuestas };
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(fileFor(s.id), JSON.stringify(s, null, 2), { flag: "wx" });
  return s;
}

export async function obtenerSolicitud(id: string): Promise<Solicitud | null> {
  try {
    return JSON.parse(await readFile(fileFor(id), "utf8"));
  } catch {
    return null;
  }
}

export async function listarSolicitudes(): Promise<Solicitud[]> {
  let files: string[];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }
  const all = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await readFile(path.join(DATA_DIR, f), "utf8")) as Solicitud),
  );
  return all.sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
}
