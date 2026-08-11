# Actividad

La línea de tiempo del proyecto: qué hizo cada agente y cada proceso, en
orden cronológico, con filtros. Es la vista de trazabilidad transversal — el
lugar donde el operador reconstruye "qué pasó aquí" sin abrir la base de
datos.

**Nombre interno del view:** `actividad`. **Componente principal:** la vista
de línea de tiempo. **Etiqueta en el sidebar:** "Actividad".

## Ubicación en la navegación

Botón "Actividad" en el cuerpo del sidebar, junto a las secciones de trabajo
del proyecto.

## Estructura principal

- **Barra de filtros:** acota qué entradas se muestran (por tipo, por
  agente, u otros criterios).
- **Lista cronológica:** una entrada por evento, del más reciente al más
  antiguo, con su agente, tipo, resumen y —cuando aplica— severidad y
  ubicación (archivo:línea).

La vista se limita a las entradas más recientes por rendimiento (hay un
tope de cuántas se cargan).

## Elementos interactivos

- **Filtros:** cambian el subconjunto visible. Cuando un filtro no deja
  nada, la vista lo dice explícitamente (distinto de "no hay actividad").
- **Entrada de actividad:** muestra el detalle de un evento; los que llevan
  ubicación permiten situar el hallazgo en el código.

## Estados de la vista

- **Sin proyecto:** estado vacío que invita a elegir uno.
- **Sin actividad:** el proyecto no ha generado eventos todavía ("la
  generan los escaneos y los agentes").
- **Filtrando sin resultados:** hay actividad pero ninguna cumple el
  filtro.
- **Con entradas:** la línea de tiempo poblada.

## Flujos que dispara

Es una vista de lectura: no dispara flujos que modifiquen el sistema.
Refleja lo que otros flujos produjeron:

- Eventos del motor de auto-reparación →
  [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).
- Corridas de agentes de auditoría y chat →
  [FLOWS/SCAN](../FLOWS/SCAN.md) y [FLOWS/CHAT](../FLOWS/CHAT.md).
- Episodios de capacidades →
  [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md).

## Datos que muestra

- El feed de actividad por proyecto → tabla `activity`.
- Correlacionable con la telemetría de corridas (`agent_runs`) y el libro
  de vida del motor (`proposal_events`) para reconstruir una historia
  completa.

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `activity:project`, `activity:agent` — el feed filtrado.
- `agent:stats` — estadísticas de un agente.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Rendimiento](rendimiento.md) — la vista agregada de coste y métricas.
- [Sentinel Omega](sentinel-omega.md) — el registro forense
  complementario.
- [DATA-MODEL](../DATA-MODEL.md) — las tablas de historial.
