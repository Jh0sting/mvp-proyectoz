# Proyecto Z · MVP

Aplicación web donde una persona responde preguntas sobre su terreno y su familia para recibir el anteproyecto de su vivienda.

## Estado

- [x] **Paso 1:** formulario web con lógica condicional (sin pagos).
- [x] **Paso 2:** motor de IA que genera los planos a partir de las respuestas.
- [ ] **Paso 3:** revisión del arquitecto y entrega al cliente.
- [ ] **Paso 4:** piloto con clientes reales.

## Cómo correrlo

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local   # y completa las variables
npm run dev        # http://localhost:3000
npm test           # pruebas del formulario y del motor de planos
```

| Variable | Para qué |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude, que genera los planos. Se crea en https://console.anthropic.com. |
| `ADMIN_PASSWORD` | Contraseña del panel del arquitecto (`/admin`). Sin ella el panel queda abierto en desarrollo y cerrado en producción. |
| `ADMIN_USER` | Usuario del panel. Por defecto `socio`. |

## Panel del arquitecto (`/admin`)

Lista las solicitudes. En cada una se ven las respuestas resumidas y el botón **Generar planos con IA**. Al terminar se muestran las plantas, las decisiones de diseño que tomó la IA, lo que conviene revisar, y el botón **Descargar PDF** (una lámina A3 por piso, a escala, con cartela y cuadro de áreas).

## Cómo se generan los planos

1. `src/lib/planos/requisitos.ts` resume las respuestas y calcula el área techada máxima del primer piso según el área libre.
2. `src/lib/planos/generar.ts` pide a Claude el diseño como rectángulos en metros, piso por piso, con salida estructurada.
3. `src/lib/planos/validar.ts` revisa el diseño: que todo esté dentro del terreno, sin superposiciones, con el área libre, escaleras alineadas, pisos apoyados, cochera al frente, medidas mínimas, accesos y luz natural, y lo que el cliente marcó como indispensable. Si hay errores, se los devuelve a Claude para que corrija (hasta 3 intentos) y se queda con el mejor.
4. `src/lib/planos/dibujar.ts` y `pdf.ts` dibujan las plantas en SVG y en PDF.

Cada generación hace entre 1 y 3 llamadas a Claude Opus 5.5.

## Cómo está organizado

| Archivo | Qué hace |
| --- | --- |
| `src/lib/form/schema.ts` | Las 20 preguntas, sus opciones, máximos y preguntas condicionales. Para cambiar el formulario se edita este archivo. |
| `src/lib/form/steps.ts` | Arma la lista de pasos según las respuestas (incluye una ficha por integrante). |
| `src/lib/form/validate.ts` | Validación compartida entre el navegador y el servidor. |
| `src/components/Wizard.tsx` | El asistente paso a paso. Guarda un borrador en el navegador para no perder respuestas al recargar. |
| `src/app/api/solicitudes/route.ts` | Recibe y valida las respuestas, y las guarda. |
| `src/lib/storage.ts` | Guarda cada solicitud como un archivo JSON en `data/solicitudes/` (o en `DATA_DIR`). |

Las respuestas se guardan ya limpias: solo quedan las preguntas que aplicaban, con los números normalizados y el área calculada si no se ingresó. Ese JSON es la entrada del paso 2.

> El guardado en archivos sirve para desarrollo y para un servidor propio. Para publicar en un hosting sin disco persistente (como Vercel) hay que cambiar `storage.ts` por una base de datos.
