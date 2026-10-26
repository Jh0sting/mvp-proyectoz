import type { Answers } from "../form/schema";
import type { Terreno } from "./requisitos";
import { type Ambiente, DESCUBIERTOS, type Diseno, EXTERIORES, type Problema, type TipoAmbiente } from "./tipos";

const TOL = 0.02;

type Rect = { x: number; y: number; ancho: number; largo: number };

export const area = (r: Rect) => r.ancho * r.largo;

function interseccion(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.ancho, b.x + b.ancho) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.largo, b.y + b.largo) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Largo del borde que comparten dos rectángulos que se tocan. */
function bordeComun(a: Rect, b: Rect): number {
  const solapaX = Math.min(a.x + a.ancho, b.x + b.ancho) - Math.max(a.x, b.x);
  const solapaY = Math.min(a.y + a.largo, b.y + b.largo) - Math.max(a.y, b.y);
  const tocanEnX = Math.abs(a.x + a.ancho - b.x) < TOL || Math.abs(b.x + b.ancho - a.x) < TOL;
  const tocanEnY = Math.abs(a.y + a.largo - b.y) < TOL || Math.abs(b.y + b.largo - a.y) < TOL;
  if (tocanEnX && solapaY > 0) return solapaY;
  if (tocanEnY && solapaX > 0) return solapaX;
  return 0;
}

const techado = (a: Ambiente) => !DESCUBIERTOS.has(a.tipo);
const m2 = (n: number) => `${n.toFixed(1)} m²`;
const m = (n: number) => `${n.toFixed(2)} m`;

/** Medida mínima del lado corto y área mínima por tipo de ambiente. */
const MINIMOS: Partial<Record<TipoAmbiente, { lado: number; area: number }>> = {
  dormitorio_principal: { lado: 3.0, area: 11 },
  dormitorio: { lado: 2.6, area: 8 },
  dormitorio_visitas: { lado: 2.6, area: 8 },
  bano: { lado: 1.5, area: 3 },
  medio_bano: { lado: 0.9, area: 1.5 },
  cocina: { lado: 1.8, area: 5 },
  sala: { lado: 2.8, area: 10 },
  comedor: { lado: 2.4, area: 7 },
  sala_comedor: { lado: 3.0, area: 16 },
  oficina: { lado: 2.2, area: 5.5 },
  escalera: { lado: 1.0, area: 4 },
  cochera: { lado: 2.5, area: 12.5 },
  circulacion: { lado: 0.9, area: 0 },
  lavanderia: { lado: 1.2, area: 2.5 },
};

/** Ambientes desde los que se puede entrar a otro. */
const CONECTORES: ReadonlySet<TipoAmbiente> = new Set(["circulacion", "escalera", "sala", "comedor", "sala_comedor", "cocina", "sala_tv"]);
const NECESITAN_LUZ: ReadonlySet<TipoAmbiente> = new Set([
  "dormitorio_principal",
  "dormitorio",
  "dormitorio_visitas",
  "sala",
  "comedor",
  "sala_comedor",
  "oficina",
  "estudio",
]);

/** ¿Algún tramo del borde del ambiente da a la calle o a un espacio abierto del mismo piso? */
function tieneIluminacion(a: Ambiente, cubiertos: Ambiente[], t: Terreno): boolean {
  const d = 0.1;
  const muestras: [number, number][] = [];
  for (let s = 0.25; s < a.ancho; s += 0.25) muestras.push([a.x + s, a.y - d], [a.x + s, a.y + a.largo + d]);
  for (let s = 0.25; s < a.largo; s += 0.25) muestras.push([a.x - d, a.y + s], [a.x + a.ancho + d, a.y + s]);
  return muestras.some(([px, py]) => {
    if (py < 0) return true; // da a la calle
    if (px < 0 || px > t.frente || py > t.fondo) return false; // lindero con vecino
    const e = 1e-6; // un punto justo en el borde entre dos ambientes cuenta como cubierto
    return !cubiertos.some((c) => c !== a && px >= c.x - e && px <= c.x + c.ancho + e && py >= c.y - e && py <= c.y + c.largo + e);
  });
}

function dormitoriosNecesarios(a: Answers): number {
  const integrantes = a.integrantes ?? [];
  const pareja = integrantes.filter((p) => p.relacion === "pareja").length > 0 ? 1 : 0;
  const n = Math.max(1, integrantes.length - pareja);
  return n + (a.habitacion_visitas === "si" ? 1 : 0);
}

const OBLIGATORIO_A_TIPO: Record<string, TipoAmbiente[]> = {
  walk_in_closet: ["walk_in_closet"],
  oficina: ["oficina"],
  estudio_zona_para_tareas: ["estudio", "oficina"],
  sala_de_tv_entretenimiento: ["sala_tv"],
  lavanderia: ["lavanderia"],
  deposito: ["deposito"],
  patio_jardin: ["patio", "jardin"],
  terraza: ["terraza"],
  parrilla: ["parrilla", "terraza", "patio"],
  piscina: ["piscina"],
  gimnasio: ["gimnasio"],
  cochera: ["cochera"],
};

/**
 * Revisa que el diseño sea construible y coherente con el terreno y con lo
 * que pidió el cliente. Los errores hacen que se pida una corrección al
 * modelo; los avisos se muestran al arquitecto.
 */
export function validarDiseno(d: Diseno, t: Terreno, respuestas: Answers): Problema[] {
  const p: Problema[] = [];
  const error = (mensaje: string) => p.push({ gravedad: "error", mensaje });
  const aviso = (mensaje: string) => p.push({ gravedad: "aviso", mensaje });

  if (t.pisos !== null && d.pisos !== t.pisos) error(`El cliente pidió ${t.pisos} pisos y el diseño tiene ${d.pisos}.`);
  if (d.pisos < 1 || d.pisos > 4) error(`El diseño debe tener entre 1 y 4 pisos (tiene ${d.pisos}).`);
  const niveles = d.plantas.map((pl) => pl.nivel).sort((a, b) => a - b);
  if (niveles.join() !== Array.from({ length: d.pisos }, (_, i) => i + 1).join()) {
    error(`Debe haber exactamente una planta por nivel, del 1 al ${d.pisos} (hay niveles: ${niveles.join(", ") || "ninguno"}).`);
  }

  const ids = new Set<string>();
  for (const pl of d.plantas) {
    for (const a of pl.ambientes) {
      if (ids.has(a.id)) error(`El id "${a.id}" está repetido.`);
      ids.add(a.id);
    }
  }

  const plantas = [...d.plantas].sort((a, b) => a.nivel - b.nivel);
  for (const pl of plantas) {
    const piso = `Piso ${pl.nivel}`;
    for (const a of pl.ambientes) {
      if (!(a.ancho > 0 && a.largo > 0)) {
        error(`${piso}: ${a.nombre} tiene medidas no válidas (${a.ancho} × ${a.largo}).`);
        continue;
      }
      if (a.x < -TOL || a.y < -TOL || a.x + a.ancho > t.frente + TOL || a.y + a.largo > t.fondo + TOL) {
        error(
          `${piso}: ${a.nombre} se sale del terreno (ocupa x ${m(a.x)} a ${m(a.x + a.ancho)}, y ${m(a.y)} a ${m(a.y + a.largo)}; el terreno es ${m(t.frente)} × ${m(t.fondo)}).`,
        );
      }
      const min = MINIMOS[a.tipo];
      if (min) {
        const lado = Math.min(a.ancho, a.largo);
        if (lado < min.lado - TOL) error(`${piso}: ${a.nombre} mide ${m(lado)} en su lado corto; el mínimo es ${m(min.lado)}.`);
        else if (area(a) < min.area - TOL) error(`${piso}: ${a.nombre} tiene ${m2(area(a))}; el mínimo es ${m2(min.area)}.`);
      }
      if (pl.nivel > 1 && DESCUBIERTOS.has(a.tipo) && a.tipo !== "piscina") {
        error(`${piso}: ${a.nombre} es un ${a.tipo} descubierto; en pisos altos usa "terraza".`);
      }
    }

    for (let i = 0; i < pl.ambientes.length; i++) {
      for (let j = i + 1; j < pl.ambientes.length; j++) {
        const [a, b] = [pl.ambientes[i], pl.ambientes[j]];
        const s = interseccion(a, b);
        if (s > 0.05) error(`${piso}: ${a.nombre} y ${b.nombre} se superponen (${m2(s)}).`);
      }
    }

    // Para la luz cuentan como abiertos los ambientes descubiertos y las terrazas.
    const cerrados = pl.ambientes.filter((a) => techado(a) && a.tipo !== "terraza");
    for (const a of pl.ambientes) {
      if (NECESITAN_LUZ.has(a.tipo) && !tieneIluminacion(a, cerrados, t)) {
        aviso(`${piso}: ${a.nombre} no tiene ningún lado hacia la calle, un patio o un espacio abierto (sin iluminación ni ventilación natural).`);
      }
      if (CONECTORES.has(a.tipo) || EXTERIORES.has(a.tipo)) continue;
      const accesos = pl.ambientes.filter((b) => b !== a && bordeComun(a, b) >= 0.8);
      const llega =
        accesos.some((b) => CONECTORES.has(b.tipo)) ||
        ((a.tipo === "bano" || a.tipo === "walk_in_closet") && accesos.some((b) => b.tipo.startsWith("dormitorio"))) ||
        (a.tipo === "cochera" && a.y < TOL) ||
        (a.tipo === "lavanderia" && accesos.some((b) => EXTERIORES.has(b.tipo)));
      if (!llega) aviso(`${piso}: no hay por dónde entrar a ${a.nombre} (no comparte al menos 0.80 m de muro con un pasadizo, la escalera o una zona social).`);
    }
  }

  // Área libre en el primer piso.
  const p1 = plantas.find((pl) => pl.nivel === 1);
  if (p1) {
    const techada = p1.ambientes.filter(techado).reduce((s, a) => s + area(a), 0);
    const libre = ((t.area - techada) / t.area) * 100;
    if (libre + 0.5 < t.areaLibre) {
      error(
        `El primer piso deja ${libre.toFixed(1)} % de área libre y se requiere al menos ${t.areaLibre} % (como máximo ${m2((t.area * (100 - t.areaLibre)) / 100)} techados; hay ${m2(techada)}).`,
      );
    }
    for (const a of p1.ambientes) {
      if (a.tipo === "cochera" && a.y > TOL) error(`La cochera debe tocar el frente del terreno (y = 0); empieza en y = ${m(a.y)}.`);
    }
  }
  for (const pl of plantas) {
    if (pl.nivel === 1) continue;
    for (const a of pl.ambientes) if (a.tipo === "cochera") error(`Piso ${pl.nivel}: la cochera debe estar en el primer piso.`);
  }

  // Cada piso alto se apoya sobre el techo del piso de abajo, y las escaleras coinciden.
  for (let i = 1; i < plantas.length; i++) {
    const abajo = plantas[i - 1].ambientes.filter(techado);
    for (const a of plantas[i].ambientes) {
      const apoyado = abajo.reduce((s, b) => s + interseccion(a, b), 0);
      if (apoyado < area(a) * 0.9) {
        error(`Piso ${plantas[i].nivel}: ${a.nombre} queda en el aire; solo ${Math.round((apoyado / area(a)) * 100)} % está sobre techo del piso ${plantas[i - 1].nivel}.`);
      }
    }
  }
  if (d.pisos > 1) {
    for (const pl of plantas) {
      if (!pl.ambientes.some((a) => a.tipo === "escalera")) error(`Piso ${pl.nivel}: falta la escalera.`);
    }
    for (let i = 1; i < plantas.length; i++) {
      const e1 = plantas[i - 1].ambientes.filter((a) => a.tipo === "escalera");
      const e2 = plantas[i].ambientes.filter((a) => a.tipo === "escalera");
      const coincide = e1.some((a) => e2.some((b) => interseccion(a, b) >= 0.7 * Math.min(area(a), area(b))));
      if (e1.length && e2.length && !coincide) error(`La escalera del piso ${plantas[i].nivel} no coincide en posición con la del piso ${plantas[i - 1].nivel}.`);
    }
  }

  // Programa pedido por el cliente.
  const todos = plantas.flatMap((pl) => pl.ambientes);
  const dormitorios = todos.filter((a) => a.tipo.startsWith("dormitorio")).length;
  const necesarios = dormitoriosNecesarios(respuestas);
  if (dormitorios < necesarios) aviso(`Hay ${dormitorios} dormitorios para ${necesarios} necesarios según los integrantes y las visitas.`);
  if (!todos.some((a) => a.tipo === "cocina")) error("Falta la cocina.");
  if (!todos.some((a) => a.tipo === "bano")) error("Falta al menos un baño completo.");
  const autos = respuestas.vehiculos === "mas_3" ? 4 : Number(respuestas.vehiculos ?? 0);
  const cochera = todos.filter((a) => a.tipo === "cochera").reduce((s, a) => s + area(a), 0);
  if (autos > 0 && cochera < autos * 12.5 - TOL) aviso(`El cliente necesita ${autos} estacionamiento(s) (${m2(autos * 12.5)}) y la cochera tiene ${m2(cochera)}.`);
  const obligatorios = Array.isArray(respuestas.obligatorios) ? (respuestas.obligatorios as string[]) : [];
  for (const o of obligatorios) {
    const tipos = OBLIGATORIO_A_TIPO[String(o)];
    if (tipos && !todos.some((a) => tipos.includes(a.tipo))) aviso(`El cliente marcó como indispensable "${String(o).replace(/_/g, " ")}" y no aparece en el diseño.`);
  }
  if (obligatorios.includes("dormitorio_principal_con_bano")) {
    const principal = todos.find((a) => a.tipo === "dormitorio_principal");
    const conBano =
      principal &&
      plantas.some((pl) => pl.ambientes.includes(principal) && pl.ambientes.some((b) => b.tipo === "bano" && bordeComun(principal, b) >= 0.8));
    if (!conBano) aviso("El cliente pidió dormitorio principal con baño propio y el baño no está junto al dormitorio principal.");
  }

  return p;
}
