# Auto-mejora FORTRESS

La vista donde FORTRESS se mira a sí misma: lo que sus agentes descubren de
FORTRESS mientras trabajan en OTROS proyectos (el backlog de observaciones),
las capacidades que de ahí nacen y ascienden por episodios reales, y el
motor de auto-reparación disciplinada que repara el propio repo con firma
humana. Cada trabajo hace madurar al sistema.

**Nombre interno del view:** `sistema`. **Componente principal:** la vista
de auto-mejora. **Etiqueta en el sidebar:** "Auto-mejora FORTRESS".

## Ubicación en la navegación

Botón "Auto-mejora FORTRESS" en el cuerpo del sidebar.

## Estructura principal

Tres secciones apiladas:

- **Observaciones (backlog):** lo que los agentes anotaron sobre FORTRESS
  mismo mientras auditaban otros proyectos (bug, gap, limitación,
  oportunidad).
- **Capacidades:** las capacidades del sistema con su fase, su madurez y
  sus acciones — el ciclo de vida completo.
- **Motor de reparación:** el expediente de propuestas del motor de
  auto-reparación sobre el propio repo (C1 elegir, C2 entender, C3 generar,
  gate, revisor, reintento), cada una con sus botones de eslabón.

## Elementos interactivos

- **Proponer capacidad:** da de alta una capacidad nueva en estado
  propuesta.
- **Tarjeta de capacidad:** muestra fase, barra de madurez y —según el
  kind— las acciones. Correr un episodio la ejercita; el detalle abre su
  modal con notas de refuerzo.
- **Diálogo de activación (firma humana):** activar una capacidad de kind
  agente exige la firma explícita del operador; el escaneo de contenido del
  borrador y el techo de activos son precondiciones.
- **Botones del motor (por propuesta):** generar el fix, correr el gate,
  correr el revisor, y **reintentar** una propuesta rechazada por razones
  de razonamiento — cada uno visible solo en el estado correcto de la
  máquina.

## Estados de la vista

- **Vacío:** ni observaciones ni capacidades todavía.
- **Con backlog:** las observaciones pendientes de enrutar.
- **Con capacidades:** las tarjetas por fase, con su madurez derivada.
- **Con propuestas del motor:** el expediente de reparación con cada
  propuesta en su estado (elegido, analizado, generado, gate, omega,
  aprobado, rechazado, caducado).

## Flujos que dispara

- El ciclo de vida de capacidades, el gate por kind y el veto de OMEGA →
  [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md).
- El motor de auto-reparación end-to-end y el reintento →
  [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) y
  [FLOWS/RETRY](../FLOWS/RETRY.md).
- El bucle continuo que alimenta las capacidades →
  [Génesis de agentes](genesis-agentes.md).

## Datos que muestra

- Backlog → tabla `self_observations`.
- Capacidades, episodios y notas → tablas de capabilities.
- Propuestas y su libro de vida → tablas `repair_proposals` y
  `proposal_events`.

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `system:observations`, `system:resolve-observation` — el backlog.
- `system:capabilities`, `system:propose-capability`,
  `system:promote-capability`, `system:capability-notes`,
  `system:add-capability-note`, `system:run-episode` — el ciclo.
- `system:agent-draft`, `system:set-agent-draft`, `system:activate-agent`,
  `system:deactivate-agent` — el agente-como-dato.
- `repair:*` — el motor (propose, generate, run-gate, run-omega, retry,
  events, list).

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — el ciclo, el gate por
  kind, el veto.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — el motor que esta vista
  opera.
- [Génesis de agentes](genesis-agentes.md) — el bucle que ejercita
  capacidades solo.
- [Sentinel Omega](sentinel-omega.md) — el freno de las promociones.
