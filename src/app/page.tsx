import Link from "next/link";

const pasos = [
  { t: "Cuéntanos sobre tu terreno", d: "Medidas, distrito y cuántos pisos quieres construir." },
  { t: "Cuéntanos cómo vive tu familia", d: "Quiénes vivirán, sus rutinas y qué espacios son indispensables." },
  { t: "Recibe tu anteproyecto", d: "Planos de distribución de tu vivienda, revisados por un arquitecto." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Proyecto Z</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">El anteproyecto de tu casa, pensado para tu familia</h1>
      <p className="mt-5 text-lg text-stone-700">
        Responde un formulario de unos 10 minutos sobre tu terreno y sobre cómo vives. Con tus respuestas preparamos los planos de
        distribución de tu vivienda.
      </p>
      <Link
        href="/formulario"
        className="mt-8 inline-block rounded-lg bg-teal-700 px-6 py-3 text-lg font-semibold text-white hover:bg-teal-800"
      >
        Empezar el formulario
      </Link>

      <ol className="mt-14 grid gap-4 sm:grid-cols-3">
        {pasos.map((p, i) => (
          <li key={p.t} className="rounded-xl border border-stone-200 bg-white p-5">
            <span className="text-sm font-semibold text-teal-800">{i + 1}</span>
            <h2 className="mt-1 font-semibold">{p.t}</h2>
            <p className="mt-1 text-sm text-stone-600">{p.d}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
