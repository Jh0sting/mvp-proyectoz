import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerSolicitud } from "@/lib/storage";

export default async function GraciasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await obtenerSolicitud(id);
  if (!s) notFound();
  const nombre = String(s.respuestas.contacto_nombre ?? "").split(" ")[0];

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden>
        ✓
      </p>
      <h1 className="mt-4 text-3xl font-semibold">¡Listo{nombre ? `, ${nombre}` : ""}!</h1>
      <p className="mt-4 text-lg text-stone-700">
        Con estas respuestas podremos entender no solamente qué espacios quieres, sino también cómo vive tu familia, cuáles son sus
        necesidades y qué debe tener prioridad dentro del terreno disponible.
      </p>
      <p className="mt-4 text-stone-600">
        Te escribiremos por WhatsApp o correo cuando tu anteproyecto esté listo. Tu número de solicitud es{" "}
        <span className="font-mono text-sm">{s.id.slice(0, 8)}</span>.
      </p>
      <Link href="/" className="mt-8 inline-block font-medium text-teal-800 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
