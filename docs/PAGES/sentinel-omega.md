# Sentinel Omega

El superdashboard del meta-auditor: la vista donde el operador ve qué dice
Sentinel Omega sobre la salud del proyecto, la puntuación de sus agentes,
las discrepancias entre lo reportado y lo real, y el Libro de la Vida (el
registro forense eterno). Es la ventana a la conciencia crítica del
sistema.

**Nombre interno del view:** `omega`. **Componente principal:** el
dashboard de OMEGA. **Etiqueta en el sidebar:** "Sentinel Omega".

## Ubicación en la navegación

Botón "Sentinel Omega" en el cuerpo del sidebar (y un chip de acceso rápido
en la barra superior).

## Estructura principal

El dashboard compone varias zonas, todas con datos reales (nunca inventados):

- **Cabecera y acciones:** el proyecto auditado y las acciones de la vista.
- **Puntuación:** el score de OMEGA sobre el proyecto y sus agentes, por
  bandas.
- **Salud macro / perfil micro:** el estado general y el detalle por
  agente.
- **Discrepancias:** lo que difiere entre lo declarado y lo que hay en el
  filesystem (nunca la intención — solo la diferencia).
- **Estadísticas y comparativa:** métricas y evolución.
- **Libro de la Vida:** el registro append-only de asientos de OMEGA, que
  sobrevive al proyecto.

## Elementos interactivos

- **Pestañas / secciones:** navegar entre salud, agentes, discrepancias e
  historial.
- **Detalle de un agente:** abre su ficha con su puntuación y evidencia.
- **Paginador del historial:** recorre el Libro de la Vida.
- **Aviso de veto (observable, no botón):** cuando hay CRITICAL activo, el
  bloqueo de push se refleja como estado con su evidencia; OMEGA veta con
  archivo:línea, nunca aprueba por defecto (testigo-no-actor).

## Estados de la vista

- **Sin proyecto:** estado vacío que invita a elegir uno para auditar.
- **Sin datos de OMEGA:** las bandas muestran "sin-datos" (no un número
  inventado) hasta que haya evidencia.
- **Con auditoría:** las zonas pobladas con la puntuación por bandas, las
  discrepancias y el historial.

## Flujos que dispara

- Sentinel Omega actúa post-escaneo y su veto/registro forman parte del
  flujo de escaneo → [FLOWS/SCAN](../FLOWS/SCAN.md).
- Su rol de freno sobre promociones de capacidades →
  [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) y
  [FLOWS/GENESIS](../FLOWS/GENESIS.md).

## Datos que muestra

- El Libro de la Vida → tabla `omega_log` (sin FK a proyecto: el asiento
  sobrevive al borrado).
- Puntuación y corridas de agentes → tablas de agent_runs y del expediente.

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `omega:audit`, `omega:list`, `omega:score`, `omega:agents`, `omega:runs`,
  `omega:agent-runs`, `omega:snippet` — el dashboard completo (el snippet
  con lectura confinada al proyecto).

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [AGENTS](../AGENTS.md) — Sentinel Omega (agente 11) y su carta; no
  confundir con claude-omega, el revisor del motor.
- [Escaneo](escaneo.md) — la vista donde el veto de push se materializa.
- [FLOWS/SCAN](../FLOWS/SCAN.md) — la meta-auditoría en el flujo.
- [GLOSSARY](../GLOSSARY.md) — testigo-no-actor, evidencia-o-silencio,
  Libro de la Vida.
