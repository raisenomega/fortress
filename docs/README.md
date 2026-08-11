# Documentación de FORTRESS

Esta carpeta contiene la documentación pública del proyecto FORTRESS Command
Center. Para clonar, correr y construir el proyecto, empieza por el
`README.md` de la raíz; para entender el proyecto, empieza por
[OVERVIEW](OVERVIEW.md) aquí.

## Estado de la documentación

A fecha de 2026-08-11, están disponibles los 5 documentos fundacionales
(overview, arquitectura, principios, glosario y modelo de seguridad) y el
capítulo completo del motor de auto-reparación (3 flujos, actores, modelo de
datos, IPC y 30 ADRs). Los flujos del sistema pre-motor, las páginas de UI,
la historia y los documentos operativos siguen en construcción. Este índice
se actualiza a medida que llegan.

## Por dónde empezar

Según el objetivo del lector:

- **Entender qué es FORTRESS y para quién:** [OVERVIEW](OVERVIEW.md)
- **Ver la arquitectura del sistema:** [ARCHITECTURE](ARCHITECTURE.md)
- **Entender los principios de trabajo:** [PRINCIPLES](PRINCIPLES.md)
- **Consultar un término desconocido:** [GLOSSARY](GLOSSARY.md)
- **Entender el modelo de seguridad:** [SECURITY-MODEL](SECURITY-MODEL.md)

## Referencia

Documentos listos:

- **[OVERVIEW.md](OVERVIEW.md)** — Qué es FORTRESS, para quién, qué hace y
  qué NO hace, cómo funciona a 10.000 pies y el estado honesto de cada
  capacidad (hecho / parcial / pendiente) a la fecha de corte.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Las cuatro capas DDD con ejemplos
  reales del código, las reglas duras verificadas por ESLint, base de datos,
  IPC, distribución, testing y qué documentos consume el runtime (y por qué
  viven donde viven).
- **[PRINCIPLES.md](PRINCIPLES.md)** — 16 principios de método, cada uno
  nacido de un error real, con contexto, regla y ejemplo. El documento crece
  y nunca borra un principio.
- **[GLOSSARY.md](GLOSSARY.md)** — 61 términos en orden alfabético con
  referencias cruzadas: la máquina de estados del motor completa, los guards
  de seguridad, la infraestructura y la doctrina.
- **[SECURITY-MODEL.md](SECURITY-MODEL.md)** — Activos, actores y
  mitigaciones descritas por clase de amenaza. Omite ubicaciones y detalle
  histórico de forma intencional: describe qué protege, no dónde buscar
  debilidades.

Documentos del capítulo del motor de auto-reparación (listos):

- **[DATA-MODEL.md](DATA-MODEL.md)** — el esquema SQLite completo: las 19
  tablas con columnas, índices y migraciones exactas.
- **[IPC.md](IPC.md)** — los 105 canales IPC por dominio, con contratos y
  guards por clase.
- **[AGENTS.md](AGENTS.md)** — los 4 actores del motor (3 agentes LLM + el
  gate mecánico); se ampliará con los 11 agentes de auditoría.
- **[FLOWS/SELF-REPAIR.md](FLOWS/SELF-REPAIR.md)** — la cadena completa del
  motor con ejemplo real y costes.
- **[FLOWS/GRAPH-REINDEX.md](FLOWS/GRAPH-REINDEX.md)** — el realineado
  automático del Knowledge Graph.
- **[FLOWS/RETRY.md](FLOWS/RETRY.md)** — el reintento explícito de
  propuestas rechazadas.
- **[DECISIONS/](DECISIONS/README.md)** — ADR-001 a ADR-030 (motor de
  auto-reparación); las fases retroactivas añadirán los del sistema
  pre-motor.

Documentos por completar (sistema pre-motor):

- `FLOWS/SCAN.md`, `FLOWS/CHAT.md`, `FLOWS/LOOP-VIEJO.md`,
  `FLOWS/POSTURE.md`, `FLOWS/CAPABILITIES.md`, `FLOWS/GENESIS.md` — los
  flujos end-to-end restantes.
- `PAGES/` — una entrada por vista de la interfaz.
- `AGENTS.md` consolidado — los 11 agentes originales más los del motor.
- `DECISIONS/` — ADRs adicionales previos al motor.

Documentos por completar (historia y operativa):

- `HISTORY.md` — cronología del proyecto.
- `CHANGELOG.md` — releases.
- `ROADMAP.md` — próximos bloques técnicos.
- `CONTRIBUTING.md` — cómo se trabaja en FORTRESS.
- `TROUBLESHOOTING.md` — problemas conocidos y soluciones.
- `RELEASE.md` — proceso de release y rebuild.
- `DEV-SETUP.md` — configuración de un desarrollador desde cero.

## Convenciones

- Markdown estándar; referencias cruzadas entre documentos con
  `[texto](OTRO-DOC.md#anchor)` (todos los documentos son hermanos en esta
  carpeta).
- Los principios de escritura viven en [PRINCIPLES.md](PRINCIPLES.md) — en
  particular el 13 (sin documentación no hay merge) y el 6 (datos vs
  metadatos).
- Todo cambio grande de arquitectura genera un ADR en `DECISIONS/`.

## Fuera de esta carpeta

- `README.md` en la raíz — puerta de entrada al repo: desarrollo, build,
  distribución y dónde vive tu información.
- `templates/` — plantillas universales que FORTRESS distribuye a otros
  proyectos; no documentan a FORTRESS mismo.
- `internal/` — documentación interna del operador (gitignored, no visible
  en el repo).

`CONSTITUCION.md` en la raíz del proyecto es un manifiesto interno del
operador. Su ubicación final (pública, interna, o retirada) se decidirá en
el capítulo de producción.
