# Cognition

El libro de memoria del proyecto: la vista que lee el COGNITION-LOG —
patrones aprendidos, reflexiones por sesión y mapa de atención— junto al
Knowledge Graph del código. Es la ventana a lo que el sistema recuerda de un
proyecto.

**Nombre interno del view:** `cognition`. **Componente principal:** la vista
de cognición. **Etiqueta en el sidebar:** "Cognition".

## Ubicación en la navegación

Botón "Cognition" en el cuerpo del sidebar.

## Estructura principal

- **Resumen:** el estado general del cerebro del proyecto (generación,
  métricas).
- **Mapa de atención:** las zonas del código con más peso y su razón.
- **Patrones:** los patrones registrados, cada uno con su estado
  (activo, mitigado, extinto) — se muestra su estructura, no se reproduce
  contenido sensible literal.
- **Reflexiones:** las reflexiones por sesión, de la más reciente hacia
  atrás.
- **Knowledge Graph:** el panel del grafo del código (estado del índice,
  estadísticas).

## Elementos interactivos

Vista principalmente de lectura. Su interacción es de navegación: recorrer
patrones y reflexiones, y consultar el estado del grafo. **FORTRESS LEE este
archivo, no lo escribe desde esta vista** — decirlo evita que el operador
espere que la app lo cree sola.

## Estados de la vista

- **Sin proyecto:** estado vacío que invita a elegir uno.
- **Sin COGNITION-LOG:** el proyecto aún no tiene libro; se muestra el
  panel del grafo y un aviso de que el archivo no existe todavía.
- **Con memoria:** las secciones pobladas — resumen, atención, patrones,
  reflexiones y grafo.

## Flujos que dispara

Es una vista de lectura. El COGNITION-LOG lo escriben otros procesos:

- La reescritura determinista post-escaneo (parte del flujo de escaneo) →
  [FLOWS/SCAN](../FLOWS/SCAN.md).
- Los patrones y la memoria alimentan las decisiones de los agentes al
  arrancar → [AGENTS](../AGENTS.md).

## Datos que muestra

- El COGNITION-LOG del proyecto: es un archivo `.md` en la raíz del
  proyecto (en su filesystem), NO una tabla de la base — [DATA-MODEL](../DATA-MODEL.md)
  lo confirma en "Lo que NO está en la base".
- El estado del índice del grafo → columnas de proyecto (la proyección del
  grafo).

## Canales IPC usados

- `cognition:read` — el libro parseado del proyecto (el contenido es texto,
  jamás se ejecuta).
- `graph:status`, `graph:state`, `graph:reindex` — el panel del grafo.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [FLOWS/SCAN](../FLOWS/SCAN.md) — la reescritura determinista del
  COGNITION-LOG post-escaneo.
- [FLOWS/GRAPH-REINDEX](../FLOWS/GRAPH-REINDEX.md) — el realineado del
  grafo que muestra el panel.
- [GLOSSARY](../GLOSSARY.md) — cognition-log, PTN, extinción honesta.
