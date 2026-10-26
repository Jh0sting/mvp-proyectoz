import type { Answers } from "../../form/schema";
import type { Diseno } from "../tipos";

// Caso de prueba: terreno de 8 × 20 m en Surco, 2 pisos, pareja con
// oficina en casa, visitas frecuentes y un auto. El diseño fue escrito a
// mano para probar la validación y el dibujo; no es una salida del modelo.

export const respuestasEjemplo: Answers = {
  frente: 8,
  fondo: 20,
  area_total: 160,
  distrito: "Santiago de Surco",
  pisos: "2",
  licencia: "si",
  area_libre: "30",
  personas: "2",
  integrantes: [
    { edad: 35, dedicacion: "Ingeniero", ocupacion: "trabaja", lugar: "hibrido", espacio: "oficina", oficina_privada: "si" },
    { edad: 33, relacion: "pareja", dedicacion: "Docente", ocupacion: "trabaja_y_estudia", lugar: "fuera_de_casa", espacio: "espacio_de_estudio" },
  ],
  visitantes: ["padres"],
  habitacion_visitas: "si",
  frecuencia_visitas: "todos_los_fines_de_semana",
  tamano_reuniones: "6_10",
  espacios_sociales: ["sala_amplia", "terraza", "parrilla"],
  cocina: "con_isla",
  obligatorios: ["dormitorio_principal_con_bano", "cochera", "oficina"],
  vehiculos: "1",
  tipo_vehiculos: ["auto"],
  exteriores: ["patio", "terraza", "parrilla"],
  mascotas: "si",
  mascotas_cantidad: 1,
  mascotas_tipo: "perro mediano",
  privacidad: "muy_importante",
  privacidad_espacios: ["dormitorio_principal"],
  iluminacion: "son_fundamentales",
  estilo: "contemporanea",
  prioridades: ["mayor_area_social", "oficina", "cochera"],
  sacrificios: ["piscina", "tamano_de_la_cocina"],
  sensaciones: ["comodo", "en_familia"],
};

export const disenoEjemplo: Diseno = {
  pisos: 2,
  notas: [
    "Oficina en el primer piso hacia la calle, con acceso desde el ingreso, para recibir clientes sin pasar por la zona íntima.",
    "Sala-comedor al fondo, abierta al patio, para las reuniones de fin de semana; la terraza con parrilla queda en el segundo piso sobre ella.",
    "Dormitorio principal hacia la calle con baño propio; estudio en el segundo piso con vista a la terraza.",
  ],
  plantas: [
    {
      nivel: 1,
      ambientes: [
        { id: "p1_cochera", nombre: "COCHERA", tipo: "cochera", x: 0, y: 0, ancho: 2.6, largo: 5.5 },
        { id: "p1_ingreso", nombre: "INGRESO", tipo: "circulacion", x: 2.6, y: 0, ancho: 1.2, largo: 10 },
        { id: "p1_oficina", nombre: "OFICINA", tipo: "oficina", x: 3.8, y: 0, ancho: 4.2, largo: 3.5 },
        { id: "p1_sshh", nombre: "SS.HH.", tipo: "medio_bano", x: 3.8, y: 3.5, ancho: 1.6, largo: 2 },
        { id: "p1_lav", nombre: "LAVANDERÍA", tipo: "lavanderia", x: 5.4, y: 3.5, ancho: 2.6, largo: 2 },
        { id: "p1_escalera", nombre: "ESCALERA", tipo: "escalera", x: 0, y: 5.5, ancho: 2.6, largo: 2.8 },
        { id: "p1_pozo", nombre: "POZO DE LUZ", tipo: "patio", x: 0, y: 8.3, ancho: 2.6, largo: 1.7 },
        { id: "p1_cocina", nombre: "COCINA", tipo: "cocina", x: 3.8, y: 5.5, ancho: 4.2, largo: 4.5 },
        { id: "p1_sala", nombre: "SALA-COMEDOR", tipo: "sala_comedor", x: 0, y: 10, ancho: 8, largo: 4.5 },
        { id: "p1_patio", nombre: "PATIO", tipo: "patio", x: 0, y: 14.5, ancho: 8, largo: 5.5 },
      ],
    },
    {
      nivel: 2,
      ambientes: [
        { id: "p2_visitas", nombre: "DORM. VISITAS", tipo: "dormitorio_visitas", x: 0, y: 0, ancho: 3.8, largo: 3.6 },
        { id: "p2_principal", nombre: "DORM. PRINCIPAL", tipo: "dormitorio_principal", x: 3.8, y: 0, ancho: 4.2, largo: 4 },
        { id: "p2_bano", nombre: "BAÑO", tipo: "bano", x: 0, y: 3.6, ancho: 2.6, largo: 1.9 },
        { id: "p2_hall", nombre: "HALL", tipo: "circulacion", x: 2.6, y: 3.6, ancho: 1.2, largo: 4.7 },
        { id: "p2_hall2", nombre: "PASADIZO", tipo: "circulacion", x: 3.8, y: 4, ancho: 1.8, largo: 1.8 },
        { id: "p2_bano_p", nombre: "BAÑO PRINC.", tipo: "bano", x: 5.6, y: 4, ancho: 2.4, largo: 1.8 },
        { id: "p2_escalera", nombre: "ESCALERA", tipo: "escalera", x: 0, y: 5.5, ancho: 2.6, largo: 2.8 },
        { id: "p2_estudio", nombre: "ESTUDIO", tipo: "estudio", x: 3.8, y: 5.8, ancho: 4.2, largo: 4.2 },
        { id: "p2_terraza", nombre: "TERRAZA - PARRILLA", tipo: "terraza", x: 0, y: 10, ancho: 8, largo: 4.5 },
      ],
    },
  ],
};
