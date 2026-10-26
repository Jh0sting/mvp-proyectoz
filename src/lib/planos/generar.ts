import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Answers } from "../form/schema";
import { PISOS_MAXIMOS, resumenRespuestas, type Terreno, terrenoDe } from "./requisitos";
import { Diseno, type Problema, type ResultadoPlanos } from "./tipos";
import { validarDiseno } from "./validar";

export const MODELO = "claude-opus-5-5";
const MAX_INTENTOS = 3;

const SISTEMA = `Eres un arquitecto peruano con experiencia en vivienda unifamiliar en Lima. Diseñas anteproyectos: la distribución de ambientes de cada piso, a partir de un formulario que llenó la familia.

Entregas el diseño como rectángulos en metros sobre el terreno, piso por piso. Otro programa dibuja los planos a partir de tu respuesta y revisa que el diseño sea construible; si encuentra problemas te los devolverá para que los corrijas.

Sistema de coordenadas:
- El origen (0, 0) es la esquina del terreno a la izquierda, sobre la calle, mirando el terreno desde la calle.
- x crece hacia la derecha, en el sentido del frente. y crece desde la calle hacia el fondo.
- Cada ambiente es un rectángulo (x, y, ancho, largo). Mide a ejes de muro: los rectángulos vecinos comparten borde, sin huecos para muros.
- Usa medidas múltiplos de 0.05 m.

Reglas que se verifican:
- Todo ambiente queda dentro del terreno y ningún par de ambientes del mismo piso se superpone.
- En el primer piso, el área techada (todo lo que no es patio, jardín ni piscina) no supera lo que permite el porcentaje de área libre indicado. El espacio del terreno que no ocupas con ningún ambiente también cuenta como área libre.
- Los pisos altos se apoyan sobre ambientes techados del piso de abajo. Lo descubierto en un piso alto es "terraza".
- Si hay más de un piso, cada piso tiene una escalera (tipo "escalera") en la misma posición. Una escalera de dos tramos ocupa unos 2.40 × 2.80 m.
- La cochera está en el primer piso y toca la calle (y = 0). Cada auto necesita 2.50 × 5.00 m.
- Cada ambiente se conecta con un pasadizo ("circulacion"), la escalera o una zona social compartiendo al menos 0.80 m de muro (ahí iría la puerta). Un baño o walk-in closet puede abrir a su dormitorio.
- Dormitorios, sala, comedor y oficina necesitan al menos un lado hacia la calle, un patio, la azotea o un espacio libre del terreno. Los costados del terreno son medianeras con los vecinos: no dan luz. Si el terreno es angosto y profundo, usa patios o pozos de luz interiores.
- Medidas mínimas (lado corto / área): dormitorio principal 3.00 m / 11 m², dormitorio 2.60 m / 8 m², baño 1.50 m / 3 m², medio baño 0.90 m / 1.5 m², cocina 1.80 m / 5 m², sala 2.80 m / 10 m², comedor 2.40 m / 7 m², sala-comedor 3.00 m / 16 m², oficina 2.20 m / 5.5 m², lavandería 1.20 m / 2.5 m², pasadizo 0.90 m de ancho.

Cómo decidir:
- Respeta lo que la familia marcó como indispensable y sus prioridades. Si no cabe todo, sacrifica primero lo que la familia dijo que estaba dispuesta a sacrificar.
- Un dormitorio para quien llena el formulario y su pareja; un dormitorio por cada otro integrante, salvo que convenga compartir (por ejemplo, hermanos pequeños) y lo expliques en las notas. Agrega dormitorio de visitas solo si lo pidieron.
- Zona social en el primer piso; zona íntima en los pisos altos cuando hay más de uno. Considera horarios, trabajo desde casa y privacidad.
- Si la familia no indicó el número de pisos, elige entre 1 y ${PISOS_MAXIMOS} y justifícalo.
- En "notas" explica en español, en frases cortas, las decisiones importantes para el arquitecto que revisará el diseño: qué se priorizó, qué se dejó fuera y por qué.
- Nombres de ambientes en mayúsculas y en español, como en un plano: "SALA", "DORMITORIO 2", "SS.HH.", "PASADIZO".`;

function pedido(t: Terreno, resumen: string): string {
  const techoMax = (t.area * (100 - t.areaLibre)) / 100;
  return `Terreno: frente ${t.frente.toFixed(2)} m, fondo ${t.fondo.toFixed(2)} m, área ${t.area.toFixed(2)} m².
Área libre mínima en el primer piso: ${t.areaLibre} %${t.areaLibreRecomendada ? " (valor por defecto; la familia pidió una recomendación)" : ""}. Como máximo ${techoMax.toFixed(1)} m² techados en el primer piso.
Pisos: ${t.pisos ?? `a recomendar (entre 1 y ${PISOS_MAXIMOS})`}.

Respuestas de la familia:

${resumen}

Diseña el anteproyecto.`;
}

function correccion(problemas: Problema[]): string {
  const errores = problemas.filter((p) => p.gravedad === "error").map((p) => `- ${p.mensaje}`);
  const avisos = problemas.filter((p) => p.gravedad === "aviso").map((p) => `- ${p.mensaje}`);
  return `La revisión encontró estos problemas. Corrígelos y entrega el diseño completo otra vez.

Errores (obligatorio corregir):
${errores.join("\n") || "- Ninguno"}

Avisos (corrígelos si puedes sin romper otra regla):
${avisos.join("\n") || "- Ninguno"}`;
}

const errores = (p: Problema[]) => p.filter((x) => x.gravedad === "error").length;

export class PlanosError extends Error {}

/**
 * Genera el anteproyecto con Claude. Valida cada propuesta y, si tiene
 * errores, le pide una corrección (hasta MAX_INTENTOS). Devuelve la mejor.
 */
export async function generarPlanos(respuestas: Answers, client: Anthropic = new Anthropic()): Promise<ResultadoPlanos> {
  const terreno = terrenoDe(respuestas);
  const mensajes: BetaMessageParam[] = [{ role: "user", content: pedido(terreno, resumenRespuestas(respuestas)) }];
  let mejor: { diseno: Diseno; problemas: Problema[] } | null = null;
  let intentos = 0;

  while (intentos < MAX_INTENTOS) {
    intentos++;
    const stream = client.beta.messages.stream({
      model: MODELO,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: betaZodOutputFormat(Diseno) },
      system: SISTEMA,
      messages: mensajes,
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new PlanosError("El modelo no aceptó generar este diseño.");
    if (msg.stop_reason === "max_tokens") throw new PlanosError("La respuesta del modelo quedó incompleta.");
    const diseno = msg.parsed_output;
    if (!diseno) throw new PlanosError("El modelo no devolvió un diseño válido.");

    const problemas = validarDiseno(diseno, terreno, respuestas);
    if (!mejor || errores(problemas) < errores(mejor.problemas)) mejor = { diseno, problemas };
    if (errores(problemas) === 0) break;

    mensajes.push({ role: "assistant", content: msg.content }, { role: "user", content: correccion(problemas) });
  }

  return { generadoEn: new Date().toISOString(), modelo: MODELO, intentos, diseno: mejor!.diseno, problemas: mejor!.problemas };
}
