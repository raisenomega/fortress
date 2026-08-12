# Changelog

FORTRESS aún no ha llegado a un release público. Este documento **no usa
números de versión**: registra hitos por fecha. Cuando el proyecto alcance un
release público se adoptará un esquema de versionado formal y este changelog se
convertirá a él.

## Cómo leer este documento

Los hitos van en **orden inverso** (el más reciente arriba). Cada entrada lleva
una o más **etiquetas de categoría**:

- **[Motor]** — el motor de auto-reparación disciplinada y sus eslabones.
- **[Escaneo]** — la auditoría: los agentes, el score, Sentinel Omega, la
  superficie externa.
- **[Sistema evolutivo]** — el grafo de conocimiento, el loop autónomo, el
  ciclo de capacidades, la génesis y el aprendizaje.
- **[Seguridad]** — guardas, aislamiento, la doctrina de cero telemetría, el
  bloqueo de push.
- **[Arquitectura]** — las decisiones estructurales, la persistencia, la
  comunicación entre procesos, la frontera con el proveedor, el tema visual y
  las vistas.
- **[Documentación]** — el plan documental por fases.

Los días sin un hito destacable no aparecen: el trabajo continuo entre hitos se
refleja en el hito siguiente. Cuando el método concentra varios hitos en una
misma fecha —como el cierre documental del 2026-08-11— se registran tal cual,
sin distribuir artificialmente. Cada entrada apunta al documento donde el hito
se narra o su decisión se registra: [HISTORY](HISTORY.md) ofrece la narrativa
general, [FLOWS/](FLOWS/SELF-REPAIR.md) describe los flujos operativos, y
[DECISIONS/](DECISIONS/README.md) contiene las cincuenta y siete decisiones
arquitectónicas.

## 2026-08-11

El día más denso del proyecto: el último eslabón del motor y la totalidad del
cierre documental aterrizaron a la rama principal en la misma jornada.

- **[Motor]** Reintento explícito de propuestas rechazadas: implementado,
  firmado y mergeado. Un rechazo por razonamiento puede reintentarse creando
  una propuesta nueva con vínculo de linaje a la anterior; la vieja queda
  inmutable. Ver [FLOWS/RETRY](FLOWS/RETRY.md).
- **[Documentación]** Documentación del sistema pre-motor completa y mergeada:
  seis flujos operativos, las quince vistas de la interfaz y veintisiete
  decisiones retroactivas. El corpus público llega a noventa y dos archivos.
  Ver [HISTORY](HISTORY.md).
- **[Documentación]** Documentación del motor de auto-reparación mergeada:
  flujos, actores, modelo de datos, canales y las primeras treinta decisiones.
  Ver [HISTORY](HISTORY.md).
- **[Documentación]** Higiene estructural, documentos fundacionales —visión,
  arquitectura, principios, glosario y modelo de seguridad— mergeados en la
  misma jornada. Ver [HISTORY](HISTORY.md).

## 2026-08-10

- **[Motor]** Generación del fix en un worktree aislado sobre un ancla
  inmutable del repositorio, con una correa que limita los archivos que puede
  tocar. Ver [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).
- **[Motor]** Gate hermético: instalación limpia, verificación de tipos, linter
  y tests unitarios dentro del worktree, cada uno bloqueante.
- **[Motor]** Revisor semántico OMEGA: seis ejes de evaluación con veredicto
  recomputado por el motor. Ver [AGENTS](AGENTS.md).
- **[Sistema evolutivo]** Terminación por grupo de procesos del botón de
  detener, con escalada, para que ningún proceso hijo quede vivo tras parar.

## 2026-08-09

- **[Motor]** Primeros eslabones de la cadena de reparación: elegir el hallazgo
  de forma determinista y entenderlo contra el código vivo antes de generar.
  Ver [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).
- **[Sistema evolutivo]** Reindexado automático del grafo de conocimiento al
  arrancar, al enfocar y bajo demanda. Ver
  [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

## 2026-08-08

- **[Escaneo]** **[Seguridad]** Endurecimiento a partir de los propios escaneos
  de FORTRESS sobre sí misma: se garantizó que un repositorio auditado no puede
  suplantar al auditor y se tapó un falso verde que dejaba pasar la prueba de
  integración por la capa equivocada.

## 2026-08-07

- **[Arquitectura]** **[Sistema evolutivo]** Detalle del ciclo de capacidades y
  generación verificada del documento de arquitectura de un proyecto en un
  sandbox aislado. Ver [FLOWS/CAPABILITIES](FLOWS/CAPABILITIES.md).

## 2026-08-06

- **[Sistema evolutivo]** Grafo de conocimiento cableado con enlace vivo al
  arranque de cada agente, guiado por rol. Consultar el grafo es dos órdenes de
  magnitud más barato que abrir archivos. Ver
  [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

## 2026-08-04

Día pico de escritura del sistema pre-motor.

- **[Sistema evolutivo]** Ciclo de vida de capacidades con dos ejes
  ortogonales —fase por episodios, madurez por calidad—, gate por tipo de
  capacidad, y bucle de génesis con topes obligatorios en sandbox aislado. Ver
  [FLOWS/CAPABILITIES](FLOWS/CAPABILITIES.md) y [FLOWS/GENESIS](FLOWS/GENESIS.md).
- **[Sistema evolutivo]** Loop autónomo pre-motor con frenos de gasto y de
  ciclos, estado de espera resiliente y red de git para revertir. Ver
  [FLOWS/LOOP-VIEJO](FLOWS/LOOP-VIEJO.md).
- **[Sistema evolutivo]** Backlog de auto-mejora: los hallazgos sobre FORTRESS
  mismo se enrutan a un backlog propio.
- **[Escaneo]** Libro de la Vida de Sentinel Omega: un registro append-only que
  sobrevive al proyecto. Ver [AGENTS](AGENTS.md).

## 2026-08-03

- **[Escaneo]** Sentinel Omega, el undécimo agente y meta-auditor, con su carta
  de cuatro pilares y sus tres funciones deliberadamente rehusadas. Ver
  [AGENTS](AGENTS.md).
- **[Arquitectura]** Conectores de contexto externo con enlace vivo al arranque
  del chat, bajo una confianza por proyecto que por defecto es falsa.

## 2026-08-02

- **[Escaneo]** Escáner de seguridad real: hallazgos con evidencia persistidos y
  puntuados de forma determinista. Ver [FLOWS/SCAN](FLOWS/SCAN.md).
- **[Seguridad]** Un hallazgo de severidad crítica bloquea el push. Ver
  [SECURITY-MODEL](SECURITY-MODEL.md).
- **[Sistema evolutivo]** Detección del grafo de conocimiento y superficie
  externa: mirar la web de un proyecto desde fuera, sin atacarla.

## 2026-08-01

Origen del proyecto.

- **[Arquitectura]** Arranque con arquitectura de dominios estricta y un límite
  de setenta y cinco líneas por archivo verificado por la máquina; uso del
  intérprete de línea de comandos del agente en vez del SDK; comunicación entre
  procesos con un agregador central; y persistencia local en SQLite modular con
  migraciones aditivas. Ver [ARCHITECTURE](ARCHITECTURE.md).
- **[Seguridad]** La clave de la API se guarda cifrada con el almacenamiento
  seguro del sistema y jamás cruza al proceso de interfaz. Ver
  [SECURITY-MODEL](SECURITY-MODEL.md).
- **[Arquitectura]** Tema visual OMEGA y consola con modo supervisado y
  autónomo.

## Referencias

- [HISTORY](HISTORY.md) — la narrativa completa del proyecto.
- [DECISIONS/](DECISIONS/README.md) — las cincuenta y siete decisiones
  arquitectónicas (ADR-001 a ADR-057).
- `docs/ROADMAP.md` (por completar en Fase 4) — las direcciones próximas.
