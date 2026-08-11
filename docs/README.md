# Documentación de FORTRESS

Esta carpeta contiene la documentación pública del proyecto FORTRESS Command
Center. Para clonar, correr y construir el proyecto, empieza por el
`README.md` de la raíz; para entender el proyecto, empieza por
[OVERVIEW](OVERVIEW.md) aquí.

## Estado de la documentación

A fecha de 2026-08-11, los 5 documentos fundacionales están disponibles
(overview, arquitectura, principios, glosario y modelo de seguridad). Las
secciones de flujos end-to-end, agentes, modelo de datos, IPC, decisiones de
arquitectura y páginas de UI están en construcción, en fases retroactivas del
plan documental. Este índice se actualiza a medida que llegan.

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

Documentos por completar (motor de auto-reparación):

- `DATA-MODEL.md` — esquema SQLite completo (tablas, índices, migraciones).
- `IPC.md` — canales IPC agrupados por dominio.
- `AGENTS.md` — los agentes del sistema.
- `FLOWS/SELF-REPAIR.md` — la cadena completa del motor: elegir, entender,
  generar en worktree, gate hermético, revisor semántico.
- `FLOWS/GRAPH-REINDEX.md` — reindexado automático del Knowledge Graph.
- `FLOWS/RETRY.md` — reintento explícito de propuestas rechazadas.
- `DECISIONS/` — ADRs (Architecture Decision Records) del capítulo del
  motor.

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
