# Rendimiento

La vista agregada de coste y métricas: cuántos tokens se gastaron, en qué
proyectos, qué agentes rindieron mejor, y cómo evolucionó el score, sobre
una ventana temporal elegible. Es una vista de LECTURA densa — mucho número,
poca interacción.

**Nombre interno del view:** `rendimiento`. **Componente principal:** la
vista de rendimiento. **Etiqueta:** "Rendimiento" (acceso desde la barra
superior).

## Ubicación en la navegación

Se abre desde la barra superior de la aplicación.

## Estructura principal

- **Selector de ventana temporal:** define el período que agregan todas las
  métricas.
- **Tarjetas de uso:** los totales del período (tokens, coste, corridas).
- **Tokens por proyecto:** el reparto del gasto entre proyectos.
- **Ranking de agentes:** qué agentes acumularon más actividad o coste.
- **Tendencia del score y severidades:** la evolución de la calidad y el
  perfil de hallazgos.
- **Bloque de cognición:** un resumen de aprendizajes en el mismo período.

## Elementos interactivos

Vista de lectura: el único control real es el **selector de ventana
temporal**, que recarga todas las métricas para el período elegido (una sola
carga por cambio, sin dobles disparos). El resto son visualizaciones.

## Estados de la vista

- **Cargando:** mientras se agregan las métricas de la ventana.
- **Con datos:** todas las zonas pobladas para el período.
- **Ventana sin actividad:** las métricas muestran cero o vacío para
  períodos sin uso.

## Flujos que dispara

Es una vista de lectura: no dispara flujos que modifiquen el sistema.
Agrega lo que produjeron las corridas de todos los flujos.

## Datos que muestra

- Telemetría de corridas (tokens, coste, duración) → tabla `agent_runs`.
- Historial de escaneos y su tendencia → tablas de scans / quality_scans.

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `telemetry:session`, `telemetry:billing`, `telemetry:average`,
  `telemetry:since`, `telemetry:by-project`, `telemetry:ranking` — las
  métricas agregadas.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Actividad](actividad.md) — el detalle evento a evento (esta vista es su
  agregado).
- [DATA-MODEL](../DATA-MODEL.md) — la tabla de telemetría de corridas.
