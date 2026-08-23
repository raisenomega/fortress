# Documentación de FORTRESS

Esta carpeta contiene la documentación pública del proyecto FORTRESS Command
Center. Para clonar, correr y construir el proyecto, empieza por el
`README.md` de la raíz; para entender el proyecto, empieza por
[OVERVIEW](OVERVIEW.md) aquí.

## Estado de la documentación

Estado a 2026-08-13:

- 101 documentos públicos: 16 de nivel superior, 9 flujos en `FLOWS/`, más las
  carpetas `DECISIONS/` (60 ADRs + índice) y `PAGES/` (15 vistas + índice).
- El corpus está completo: los documentos fundacionales, el capítulo del motor
  de auto-reparación, el del sistema pre-motor, la historia y la trazabilidad,
  y los documentos operativos de contribución, entorno, resolución de problemas
  y distribución.
- La integración con el sistema está hecha: cada agente recibe en su prompt la
  referencia a los documentos que su trabajo necesita, y los `.md` de `docs/`
  están indexados en el grafo.

Este índice se actualiza a medida que el corpus cambia.

## Por dónde empezar

Según el objetivo del lector:

- **Entender qué es FORTRESS y para quién:** [OVERVIEW](OVERVIEW.md)
- **Ver la arquitectura del sistema:** [ARCHITECTURE](ARCHITECTURE.md)
- **Entender los principios de trabajo:** [PRINCIPLES](PRINCIPLES.md)
- **Consultar un término desconocido:** [GLOSSARY](GLOSSARY.md)
- **Entender el modelo de seguridad:** [SECURITY-MODEL](SECURITY-MODEL.md)
- **Saber qué tipos de defecto existen:** [TAXONOMIA-DE-DEFECTOS](TAXONOMIA-DE-DEFECTOS.md)

## Referencia

Documentos listos:

- **[OVERVIEW.md](OVERVIEW.md)** — Qué es FORTRESS, para quién, qué hace y
  qué NO hace, cómo funciona a 10.000 pies y el estado honesto de cada
  capacidad (hecho / parcial / pendiente) a la fecha de corte.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Las cuatro capas DDD con ejemplos
  reales del código, las reglas duras verificadas por ESLint, base de datos,
  IPC, distribución, testing y qué documentos consume el runtime (y por qué
  viven donde viven).
- **[PRINCIPLES.md](PRINCIPLES.md)** — 24 principios de método, cada uno
  nacido de un error real, con contexto, regla y ejemplo. El documento crece
  y nunca borra un principio.
- **[TAXONOMIA-DE-DEFECTOS.md](TAXONOMIA-DE-DEFECTOS.md)** — el vocabulario
  cerrado con el que el escáner clasifica cada hallazgo, derivado de los
  defectos reales del repositorio, y la regla de `otro`.
- **[GLOSSARY.md](GLOSSARY.md)** — términos en orden alfabético con
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
- **[AGENTS.md](AGENTS.md)** — las dos familias: los 4 actores del motor (3
  agentes LLM + el gate mecánico) y los 11 agentes de auditoría.
- **[FLOWS/SELF-REPAIR.md](FLOWS/SELF-REPAIR.md)** — la cadena completa del
  motor con ejemplo real y costes.
- **[FLOWS/GRAPH-REINDEX.md](FLOWS/GRAPH-REINDEX.md)** — el realineado
  automático del Knowledge Graph.
- **[FLOWS/RETRY.md](FLOWS/RETRY.md)** — el reintento explícito de
  propuestas rechazadas.
- **[DECISIONS/](DECISIONS/README.md)** — ADR-001 a ADR-060: el capítulo del
  motor de auto-reparación (001-030), el del sistema pre-motor (031-057) y las
  decisiones contemporáneas (058-059).

Documentos del sistema pre-motor (listos):

- **[FLOWS/SCAN.md](FLOWS/SCAN.md)**, **[FLOWS/CHAT.md](FLOWS/CHAT.md)**,
  **[FLOWS/LOOP-VIEJO.md](FLOWS/LOOP-VIEJO.md)**,
  **[FLOWS/POSTURE.md](FLOWS/POSTURE.md)**,
  **[FLOWS/CAPABILITIES.md](FLOWS/CAPABILITIES.md)**,
  **[FLOWS/GENESIS.md](FLOWS/GENESIS.md)** — los flujos end-to-end del
  sistema pre-motor.
- **[PAGES/](PAGES/README.md)** — las 15 vistas y superficies transversales
  de la interfaz, documentadas por etiqueta visible con mapeo interno.
  Incluye un README con la sección sobre el cruce de nombres Terminal/Chat.
- **[AGENTS.md](AGENTS.md)** — ampliado con los 11 agentes de auditoría
  (además de los 4 del motor).

Documentos de historia y operativa (listos):

- **[HISTORY.md](HISTORY.md)** — cómo se construyó el proyecto, por temas y
  con fechas verificadas contra el historial de git.
- **[CHANGELOG.md](CHANGELOG.md)** — los hitos por fecha, etiquetados por
  categoría. Sin números de versión mientras no haya release público.
- **[ROADMAP.md](ROADMAP.md)** — las direcciones próximas, sin fechas de
  compromiso.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — las disciplinas del proyecto, qué
  verifica la máquina y qué depende del criterio, y qué no cambia sin ADR.
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — problemas conocidos, con
  síntoma, causa y solución.
- **[RELEASE.md](RELEASE.md)** — instalación, reconstrucción en frío y el
  estado real de la distribución.
- **[DEV-SETUP.md](DEV-SETUP.md)** — poner en marcha un entorno de desarrollo
  desde cero.

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
