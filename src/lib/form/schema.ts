// Definición del "Formulario para el diseño de tu vivienda".
// Todo el formulario vive aquí como datos: la UI, la validación y el
// servidor leen esta misma definición.

export type Option = {
  value: string;
  label: string;
  /** Muestra un campo de texto "Otro: ____" cuando se elige. */
  otro?: boolean;
  /** En selección múltiple, elegir esta opción desmarca las demás (p. ej. "Ninguno"). */
  exclusive?: boolean;
};

type BaseField<A> = {
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  /** El campo solo aparece (y solo se valida) si esta condición se cumple. */
  showIf?: (scope: A, root: Answers) => boolean;
};

export type Field<A = Answers> =
  | (BaseField<A> & { kind: "number"; unit?: string; min?: number; max?: number; integer?: boolean })
  | (BaseField<A> & { kind: "text"; placeholder?: string; multiline?: boolean; format?: "email" | "phone" })
  | (BaseField<A> & { kind: "time" })
  | (BaseField<A> & { kind: "single"; options: Option[] })
  | (BaseField<A> & { kind: "multi"; options: Option[]; max?: number });

export type Value = string | number | string[] | undefined;
export type Member = Record<string, Value>;
export type Answers = { [key: string]: Value | Member[]; integrantes?: Member[] };
/** Respuestas de un paso: las generales o las de un integrante. */
export type Scope = Record<string, unknown>;

export type Section = {
  id: string;
  number?: number;
  title: string;
  help?: string;
  note?: string;
  fields: Field[];
};

export type MemberSection = {
  id: string;
  title: string;
  help?: string;
  fields: Field<Member>[];
};

const opts = (...labels: string[]): Option[] => labels.map((l) => ({ value: slug(l), label: l }));
const otro: Option = { value: "otro", label: "Otro", otro: true };

export function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const has = (v: unknown, x: string) => (Array.isArray(v) ? v.includes(x) : v === x);

// ── Preguntas 1 a 6 ─────────────────────────────────────────────────

export const sectionsBeforeMembers: Section[] = [
  {
    id: "terreno",
    number: 1,
    title: "¿Cuánto mide tu terreno?",
    help: "Si tu terreno no es rectangular, pon las medidas aproximadas y el área total que figura en tus documentos.",
    fields: [
      { id: "frente", kind: "number", label: "Frente", unit: "m", min: 3, max: 200, required: true },
      { id: "fondo", kind: "number", label: "Fondo", unit: "m", min: 3, max: 300, required: true },
      {
        id: "area_total",
        kind: "number",
        label: "Área total",
        unit: "m²",
        min: 9,
        max: 60000,
        help: "Si lo dejas vacío, usaremos frente × fondo.",
      },
    ],
  },
  {
    id: "distrito",
    number: 2,
    title: "¿En qué distrito se encuentra tu terreno?",
    fields: [{ id: "distrito", kind: "text", label: "Distrito", placeholder: "Ej. Santiago de Surco", required: true }],
  },
  {
    id: "pisos",
    number: 3,
    title: "¿Cuántos pisos deseas construir?",
    fields: [
      {
        id: "pisos",
        kind: "single",
        label: "Pisos",
        required: true,
        options: [
          { value: "1", label: "1 piso" },
          { value: "2", label: "2 pisos" },
          { value: "3", label: "3 pisos" },
          { value: "4_mas", label: "4 pisos o más" },
          { value: "recomendar", label: "No estoy seguro, quiero que me recomienden" },
        ],
      },
    ],
  },
  {
    id: "licencia",
    number: 4,
    title: "¿Tienes pensado construir con licencia?",
    fields: [
      {
        id: "licencia",
        kind: "single",
        label: "Licencia",
        required: true,
        options: [
          { value: "si", label: "Sí" },
          { value: "no", label: "No" },
          { value: "no_seguro", label: "No estoy seguro / necesito asesoría" },
        ],
      },
    ],
  },
  {
    id: "area_libre",
    number: 5,
    title: "¿Tienes alguna preferencia sobre el área libre de tu vivienda?",
    note: "El porcentaje final de área libre estará sujeto a los parámetros urbanísticos correspondientes al terreno.",
    fields: [
      {
        id: "area_libre",
        kind: "single",
        label: "Área libre",
        required: true,
        options: [
          { value: "20", label: "20 %" },
          { value: "25", label: "25 %" },
          { value: "30", label: "30 %" },
          { value: "recomendar", label: "No lo sé, quiero que me recomienden según mi terreno y normativa" },
        ],
      },
    ],
  },
  {
    id: "personas",
    number: 6,
    title: "¿Cuántas personas vivirán actualmente en la vivienda?",
    help: "Cuéntate a ti también. Luego te pediremos una ficha corta por cada persona.",
    fields: [
      {
        id: "personas",
        kind: "single",
        label: "Personas",
        required: true,
        options: [
          ...["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n })),
          { value: "mas_6", label: "Más de 6" },
        ],
      },
      {
        id: "personas_exacto",
        kind: "number",
        label: "¿Cuántas exactamente?",
        min: 7,
        max: 20,
        integer: true,
        required: true,
        showIf: (a) => a.personas === "mas_6",
      },
    ],
  },
];

// ── Ficha de cada integrante ────────────────────────────────────────

const activo = (m: Member) => ["trabaja", "estudia", "trabaja_y_estudia"].includes(String(m.ocupacion));
const trabaja = (m: Member) => ["trabaja", "trabaja_y_estudia"].includes(String(m.ocupacion));
const estudia = (m: Member) => ["estudia", "trabaja_y_estudia"].includes(String(m.ocupacion));
const enCasa = (m: Member) => m.lugar === "desde_casa" || m.lugar === "hibrido";

export const memberSection: MemberSection = {
  id: "integrante",
  title: "Ficha del integrante",
  help: "Así entendemos cómo vive cada persona y qué espacios necesita.",
  fields: [
    { id: "nombre", kind: "text", label: "Nombre o apodo", placeholder: "Para reconocer la ficha" },
    { id: "edad", kind: "number", label: "¿Qué edad tiene?", unit: "años", min: 0, max: 120, integer: true, required: true },
    {
      id: "relacion",
      kind: "single",
      label: "¿Qué relación tiene contigo?",
      required: true,
      // No se pregunta en la primera ficha, que es la de quien llena el formulario.
      options: [...opts("Pareja", "Hijo/a", "Padre/madre", "Hermano/a"), otro],
    },
    { id: "dedicacion", kind: "text", label: "¿A qué se dedica?", placeholder: "Ej. contadora, estudiante de secundaria", required: true },
    {
      id: "ocupacion",
      kind: "single",
      label: "¿Actualmente trabaja, estudia o ambas?",
      required: true,
      options: [...opts("Trabaja", "Estudia", "Trabaja y estudia", "Jubilado/a"), otro],
    },
    {
      id: "lugar",
      kind: "single",
      label: "¿Dónde realiza principalmente esta actividad?",
      required: true,
      showIf: activo,
      options: [
        { value: "fuera_de_casa", label: "Fuera de casa" },
        { value: "desde_casa", label: "Desde casa" },
        { value: "hibrido", label: "De manera híbrida" },
      ],
    },
    { id: "hora_inicio", kind: "time", label: "Hora de salida / inicio", showIf: activo },
    { id: "hora_fin", kind: "time", label: "Hora de regreso / finalización", showIf: activo },
    {
      id: "espacio",
      kind: "single",
      label: "¿Necesita algún espacio específico dentro de la vivienda para realizar sus actividades?",
      required: true,
      options: [...opts("No", "Oficina", "Espacio de estudio", "Zona para tareas"), otro],
    },
    {
      id: "oficina_privada",
      kind: "single",
      label: "Como trabaja desde casa, ¿necesita una oficina privada (cerrada y con puerta)?",
      required: true,
      showIf: (m) => trabaja(m) && enCasa(m),
      options: opts("Sí", "No, le basta un espacio abierto"),
    },
    {
      id: "espacio_estudio",
      kind: "single",
      label: "Como estudia, ¿necesita un espacio propio para estudiar o hacer tareas?",
      required: true,
      showIf: (m) => estudia(m) && !(trabaja(m) && enCasa(m)),
      options: opts("Sí, en el dormitorio", "Sí, un espacio compartido", "No"),
    },
  ],
};

// ── Preguntas 7 a 20 ────────────────────────────────────────────────

const visitasFrecuentes = ["algunas_veces_al_mes", "todos_los_fines_de_semana", "muy_frecuentemente"];

export const sectionsAfterMembers: Section[] = [
  {
    id: "visitas_familiares",
    number: 7,
    title: "¿Hay familiares que no vivirán permanentemente en la casa pero que la visitarán frecuentemente?",
    fields: [
      {
        id: "visitantes",
        kind: "multi",
        label: "Quiénes",
        required: true,
        options: [
          { value: "no", label: "No", exclusive: true },
          ...opts("Padres", "Hermanos", "Hijos", "Otros familiares", "Amigos"),
        ],
      },
      {
        id: "habitacion_visitas",
        kind: "single",
        label: "¿Necesitas una habitación para visitas?",
        required: true,
        showIf: (a) => Array.isArray(a.visitantes) && a.visitantes.length > 0 && !has(a.visitantes, "no"),
        options: opts("Sí", "No"),
      },
    ],
  },
  {
    id: "frecuencia_visitas",
    number: 8,
    title: "¿Con qué frecuencia reciben familiares o amigos en casa?",
    fields: [
      {
        id: "frecuencia_visitas",
        kind: "single",
        label: "Frecuencia",
        required: true,
        options: opts("Casi nunca", "Ocasionalmente", "Algunas veces al mes", "Todos los fines de semana", "Muy frecuentemente"),
      },
      {
        id: "tamano_reuniones",
        kind: "single",
        label: "¿Cuántas personas suelen reunirse aproximadamente?",
        required: true,
        showIf: (a) => visitasFrecuentes.includes(String(a.frecuencia_visitas)),
        options: [
          { value: "5_o_menos", label: "5 o menos" },
          { value: "6_10", label: "6–10" },
          { value: "11_15", label: "11–15" },
          { value: "16_20", label: "16–20" },
          { value: "mas_20", label: "Más de 20" },
        ],
      },
    ],
  },
  {
    id: "espacios_sociales",
    number: 9,
    title: "¿Qué espacios sociales te gustaría priorizar?",
    help: "Puedes seleccionar hasta 3.",
    fields: [
      {
        id: "espacios_sociales",
        kind: "multi",
        label: "Espacios sociales",
        required: true,
        max: 3,
        options: [
          ...opts("Sala amplia", "Comedor amplio", "Cocina integrada", "Terraza", "Patio", "Jardín", "Parrilla", "Sala de entretenimiento"),
          otro,
        ],
      },
    ],
  },
  {
    id: "cocina",
    number: 10,
    title: "¿Cómo te gustaría que fuera la cocina?",
    fields: [
      {
        id: "cocina",
        kind: "single",
        label: "Cocina",
        required: true,
        options: [
          ...opts(
            "Cerrada e independiente",
            "Abierta e integrada a la sala/comedor",
            "Con isla",
            "Con barra",
            "Pequeña y funcional",
            "Amplia y protagonista",
          ),
          { value: "recomendar", label: "No estoy seguro, quiero que me recomienden" },
        ],
      },
    ],
  },
  {
    id: "obligatorios",
    number: 11,
    title: "¿Qué necesitas obligatoriamente en tu casa?",
    help: "Selecciona máximo 5 opciones. Sabemos que puedes querer muchas cosas, pero en arquitectura necesitamos priorizar. El terreno, el presupuesto y la normativa tienen límites, por eso queremos saber qué es realmente indispensable para ti.",
    fields: [
      {
        id: "obligatorios",
        kind: "multi",
        label: "Indispensables",
        required: true,
        max: 5,
        options: [
          ...opts(
            "Dormitorio principal con baño",
            "Dormitorios adicionales",
            "Walk-in closet",
            "Oficina",
            "Estudio / zona para tareas",
            "Sala amplia",
            "Comedor",
            "Cocina amplia",
            "Cocina con isla",
            "Sala de TV / entretenimiento",
            "Lavandería",
            "Depósito",
            "Patio / jardín",
            "Terraza",
            "Parrilla",
            "Piscina",
            "Gimnasio",
            "Cochera",
            "Espacio para mascotas",
          ),
          otro,
        ],
      },
    ],
  },
  {
    id: "vehiculos",
    number: 12,
    title: "¿Cuántos vehículos necesitas estacionar dentro del terreno?",
    fields: [
      {
        id: "vehiculos",
        kind: "single",
        label: "Vehículos",
        required: true,
        options: [
          { value: "0", label: "Ninguno" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "mas_3", label: "Más de 3" },
        ],
      },
      {
        id: "tipo_vehiculos",
        kind: "multi",
        label: "¿Qué tipo de vehículos?",
        required: true,
        showIf: (a) => a.vehiculos !== undefined && a.vehiculos !== "0",
        options: [...opts("Auto", "Camioneta", "Moto"), otro],
      },
    ],
  },
  {
    id: "exteriores",
    number: 13,
    title: "¿Qué espacios exteriores te gustaría tener?",
    help: "Puedes seleccionar máximo 3.",
    fields: [
      {
        id: "exteriores",
        kind: "multi",
        label: "Exteriores",
        required: true,
        max: 3,
        options: [
          ...opts("Patio", "Jardín", "Terraza", "Parrilla", "Piscina", "Huerto"),
          { value: "ninguno", label: "Ninguno", exclusive: true },
          otro,
        ],
      },
      {
        id: "piscina_importancia",
        kind: "single",
        label: "¿Qué importancia tiene para ti la piscina?",
        required: true,
        showIf: (a) => has(a.exteriores, "piscina"),
        options: opts("Indispensable", "Me gustaría, pero puedo prescindir de ella", "Es un extra"),
      },
      {
        id: "piscina_uso",
        kind: "single",
        label: "¿Qué tipo de uso tendría?",
        required: true,
        showIf: (a) => has(a.exteriores, "piscina"),
        options: opts("Recreativo / familiar", "Para nadar o hacer ejercicio", "Decorativo / relajación", "Para niños"),
      },
    ],
  },
  {
    id: "mascotas",
    number: 14,
    title: "¿Tienes mascotas o piensas tenerlas?",
    fields: [
      { id: "mascotas", kind: "single", label: "Mascotas", required: true, options: opts("No", "Sí") },
      {
        id: "mascotas_cantidad",
        kind: "number",
        label: "¿Cuántas?",
        min: 1,
        max: 20,
        integer: true,
        required: true,
        showIf: (a) => a.mascotas === "si",
      },
      {
        id: "mascotas_tipo",
        kind: "text",
        label: "¿Qué tipo de mascotas?",
        placeholder: "Ej. 2 perros medianos y un gato",
        required: true,
        showIf: (a) => a.mascotas === "si",
      },
      {
        id: "mascotas_espacio",
        kind: "text",
        label: "¿Necesitan algún espacio específico dentro o fuera de la vivienda?",
        placeholder: "Ej. un patio techado para los perros",
        multiline: true,
        showIf: (a) => a.mascotas === "si",
      },
    ],
  },
  {
    id: "privacidad",
    number: 15,
    title: "¿Qué tan importante es para ti la privacidad dentro de la vivienda?",
    fields: [
      {
        id: "privacidad",
        kind: "single",
        label: "Privacidad",
        required: true,
        options: opts("Muy importante", "Importante", "Poco importante", "No es una prioridad"),
      },
      {
        id: "privacidad_espacios",
        kind: "multi",
        label: "¿Qué espacios deberían tener mayor privacidad?",
        required: true,
        showIf: (a) => a.privacidad === "muy_importante" || a.privacidad === "importante",
        options: [...opts("Dormitorio principal", "Dormitorios", "Oficina", "Toda la zona privada"), otro],
      },
    ],
  },
  {
    id: "iluminacion",
    number: 16,
    title: "¿Qué importancia tienen para ti la iluminación y ventilación natural?",
    fields: [
      {
        id: "iluminacion",
        kind: "single",
        label: "Iluminación y ventilación",
        required: true,
        options: [
          ...opts("Son fundamentales", "Son importantes", "No son una prioridad"),
          { value: "recomendar", label: "No lo sé, quiero que me recomienden" },
        ],
      },
    ],
  },
  {
    id: "estilo",
    number: 17,
    title: "¿Qué estilo de vivienda te representa más?",
    fields: [
      {
        id: "estilo",
        kind: "single",
        label: "Estilo",
        required: true,
        options: [
          ...opts("Moderna / minimalista", "Contemporánea", "Cálida / acogedora", "Industrial", "Tradicional", "Rústica"),
          otro,
          { value: "no_seguro", label: "No estoy seguro" },
        ],
      },
    ],
  },
  {
    id: "prioridades",
    number: 18,
    title: "Si solamente pudieras elegir 5 características que tu casa debe tener, ¿cuáles serían tus prioridades?",
    help: "Selecciona máximo 5.",
    fields: [
      {
        id: "prioridades",
        kind: "multi",
        label: "Prioridades",
        required: true,
        max: 5,
        options: [
          ...opts(
            "Mayor área social",
            "Dormitorio principal amplio",
            "Más dormitorios",
            "Cocina amplia",
            "Oficina",
            "Espacios para estudiar",
            "Patio / jardín",
            "Terraza",
            "Piscina",
            "Cochera",
            "Mayor iluminación natural",
            "Mayor privacidad",
            "Espacios de almacenamiento",
            "Áreas para reuniones familiares",
            "Mejores acabados",
          ),
          otro,
        ],
      },
    ],
  },
  {
    id: "sacrificios",
    number: 19,
    title: "Si el presupuesto o el terreno no permitieran tenerlo todo, ¿qué estarías dispuesto a sacrificar primero?",
    help: "Selecciona hasta 3.",
    fields: [
      {
        id: "sacrificios",
        kind: "multi",
        label: "Sacrificaría",
        required: true,
        max: 3,
        options: [
          ...opts(
            "Tamaño de la sala",
            "Tamaño de la cocina",
            "Número de dormitorios",
            "Terraza",
            "Patio / jardín",
            "Piscina",
            "Cochera",
            "Oficina",
            "Área de entretenimiento",
            "Tamaño de los ambientes",
            "Acabados",
          ),
          otro,
        ],
      },
    ],
  },
  {
    id: "sensaciones",
    number: 20,
    title: "¿Cómo quieres sentirte cuando estés dentro de tu casa?",
    help: "Elige máximo 3.",
    fields: [
      {
        id: "sensaciones",
        kind: "multi",
        label: "Sensaciones",
        required: true,
        max: 3,
        options: [
          ...opts(
            "Tranquilo",
            "Cómodo",
            "Seguro",
            "En familia",
            "Con privacidad",
            "Conectado con la naturaleza",
            "Inspirado",
            "Con sensación de amplitud",
            "Moderno",
            "Acogedor",
            "Ordenado",
          ),
          otro,
        ],
      },
    ],
  },
  {
    id: "contacto",
    title: "¿A dónde te enviamos tu anteproyecto?",
    help: "Usaremos estos datos solo para entregarte tu anteproyecto y resolver dudas sobre tu vivienda.",
    fields: [
      { id: "contacto_nombre", kind: "text", label: "Nombre completo", required: true },
      { id: "contacto_whatsapp", kind: "text", label: "WhatsApp", format: "phone", placeholder: "Ej. 987 654 321", required: true },
      { id: "contacto_email", kind: "text", label: "Correo electrónico", format: "email", placeholder: "tucorreo@ejemplo.com", required: true },
    ],
  },
];
