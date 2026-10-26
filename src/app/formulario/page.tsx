import type { Metadata } from "next";
import { Wizard } from "@/components/Wizard";

export const metadata: Metadata = { title: "Formulario para el diseño de tu vivienda · Proyecto Z" };

export default function FormularioPage() {
  return (
    <main>
      <Wizard />
    </main>
  );
}
