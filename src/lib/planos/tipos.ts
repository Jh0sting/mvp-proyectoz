import { z } from "zod";

// Tipos de ambiente que el motor sabe dibujar y validar.
export const TIPOS_AMBIENTE = [
  "sala",
  "comedor",
  "sala_comedor",
  "cocina",
  "dormitorio_principal",
  "dormitorio",
  "dormitorio_visitas",
  "bano",
  "medio_bano",
  "walk_in_closet",
  "oficina",
  "estudio",
  "sala_tv",
  "lavanderia",
  "deposito",
  "cochera",
  "escalera",
  "circulacion",
  "terraza",
  "patio",
  "jardin",
  "piscina",
  "parrilla",
  "gimnasio",
  "otro",
] as const;

export type TipoAmbiente = (typeof TIPOS_AMBIENTE)[number];

/** Ambientes sin techo: cuentan como área libre en el primer piso. */
export const DESCUBIERTOS: ReadonlySet<TipoAmbiente> = new Set(["patio", "jardin", "piscina"]);
/** Ambientes exteriores que pueden ir sobre un techo (azotea o terraza). */
export const EXTERIORES: ReadonlySet<TipoAmbiente> = new Set(["terraza", "patio", "jardin", "piscina", "parrilla"]);

export const Ambiente = z.object({
  id: z.string().describe("Identificador corto y único en todo el diseño, p. ej. 'p1_sala'."),
  nombre: z.string().describe("Nombre que se imprime en el plano, en mayúsculas, p. ej. 'DORMITORIO 2'."),
  tipo: z.enum(TIPOS_AMBIENTE),
  x: z.number().describe("Distancia en metros desde el lindero izquierdo (mirando el terreno desde la calle)."),
  y: z.number().describe("Distancia en metros desde el lindero frontal (la calle) hacia el fondo."),
  ancho: z.number().describe("Medida en metros en el sentido del frente (eje x)."),
  largo: z.number().describe("Medida en metros en el sentido del fondo (eje y)."),
});
export type Ambiente = z.infer<typeof Ambiente>;

export const Planta = z.object({
  nivel: z.number().int().describe("1 para el primer piso, 2 para el segundo, etc."),
  ambientes: z.array(Ambiente),
});
export type Planta = z.infer<typeof Planta>;

export const Diseno = z.object({
  pisos: z.number().int(),
  plantas: z.array(Planta),
  notas: z
    .array(z.string())
    .describe("Decisiones de diseño explicadas en español para el arquitecto revisor: qué se priorizó y qué se sacrificó y por qué."),
});
export type Diseno = z.infer<typeof Diseno>;

export type Problema = { gravedad: "error" | "aviso"; mensaje: string };

export type ResultadoPlanos = {
  generadoEn: string;
  modelo: string;
  intentos: number;
  diseno: Diseno;
  problemas: Problema[];
};
