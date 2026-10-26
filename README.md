# Proyecto Z · MVP

Aplicación web donde una persona responde preguntas sobre su terreno y su familia para recibir el anteproyecto de su vivienda.

## Estado

- [x] **Paso 1:** formulario web con lógica condicional (sin pagos).
- [ ] **Paso 2:** motor de IA que genera los planos a partir de las respuestas.
- [ ] **Paso 3:** revisión del arquitecto y entrega al cliente.
- [ ] **Paso 4:** piloto con clientes reales.

## Cómo correrlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas de la lógica del formulario
```

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
