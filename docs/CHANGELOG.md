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
[DECISIONS/](DECISIONS/README.md) contiene las setenta y cinco decisiones
arquitectónicas.

## 2026-08-28

**[Escaneo]** La llave inglesa que marca un hallazgo como ya arreglado **vuelve
a existir**: pedía su nota con `window.prompt`, que Electron no implementa —
lanzaba una excepción que moría muda, así que el clic no hacía nada y nunca lo
había hecho. Ahora la pide un diálogo. De paso, el componente de modales pasa a
montarse por portal: era el primero que nacía dentro de una tabla y su texto se
salía de la caja, con todo el gate en verde
([ADR-075](DECISIONS/adr-075-el-modal-por-portal.md)).

**[Motor]** Las tres propuestas que llevaban semanas sin salida quedan cerradas,
cada una por su vía: la del veto con el botón nuevo, su hallazgo marcado con la
llave, y la huérfana —invisible para toda la interfaz, porque su proyecto se
había borrado— por el canal directo.

**[Documentación]** El Acto 6 queda documentado en ocho commits: cuatro
decisiones nuevas ([ADR-072](DECISIONS/adr-072-caducado-no-miente.md) a
[ADR-075](DECISIONS/adr-075-el-modal-por-portal.md)), la referencia técnica —los
diez canales que faltaban en [IPC](IPC.md), el ciclo de vida con su salida, y la
Capa 4 escrita por primera vez en [SECURITY-MODEL](SECURITY-MODEL.md)—, las
páginas que el operador lee, y esta narrativa.

## 2026-08-27

**[Seguridad]** El circuit breaker de la Capa 4 **tiene salida**. Su mensaje
prometía «revisa el detalle forense y desbloquéalo a mano» desde que existe, y
no había cómo: ningún SQL quitaba la marca, ningún canal lo intentaba, ninguna
pantalla lo ofrecía. Ahora un aviso en el expediente enseña el forense y, solo
tras verlo, permite desbloquear; la decisión queda asentada como acto humano
([ADR-074](DECISIONS/adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md)).

**[Sistema evolutivo]** Y el mismo breaker **frena el reindexado del grafo**, que
era la única acción que no lo consultaba: un proyecto contaminado se realineaba
igual, sobre todo al arrancar. El freno va en el embudo por el que pasan las tres
puertas, no en el handler
([ADR-073](DECISIONS/adr-073-el-freno-en-el-embudo.md)). Las dos mitades se
necesitan: frenar sin salida habría condenado el proyecto.

**[Motor]** Una propuesta viva **puede retirarse**. Hasta hoy solo sabía avanzar
—firmar, reintentar, o esperar a caducar—, y la que no admitiera ninguna de las
tres se quedaba viva para siempre con su hallazgo fuera de la cola. Retirar la
CADUCA con el motivo del operador, sin mentir sobre quién juzgó y sin bloquear el
hallazgo ([ADR-072](DECISIONS/adr-072-caducado-no-miente.md)).

## 2026-08-26

**[Motor]** El motor cierra sus propios arreglos: un drenaje volvió a mirar los
cuatro hallazgos que los fixes firmados el día anterior habían resuelto, y los
cuatro se extinguieron **con juicio y motivo escrito**. La vuelta completa
—detectar, reparar, firmar, volver a mirar, cerrar diciendo por qué— ocurre por
primera vez sobre el propio repositorio.

## 2026-08-25

**[Escaneo]** La identidad de los hallazgos anteriores al cambio de clave queda
reconciliada: una pasada de agente les asigna tipo y símbolo, y las que resultan
ser el mismo defecto se fusionan conservando la fila más antigua con su fecha de
nacimiento. La absorbida no se borra — se marca con quién se fusionó y sin fecha
de resolución, porque no se resolvió
([ADR-071](DECISIONS/adr-071-cuando-dos-filas-son-una.md)).

**[Motor]** Un hallazgo cuyo defecto ya estaba arreglado murió por primera vez
**con juicio**: cuatro extinciones motivadas en esa tanda, entre ellas la
relajación de la CSP. Es la red de «nada muere sin juicio» funcionando en el
sentido para el que se construyó.

**[Motor]** La transición que aprueba una propuesta persiste el veredicto que
recomputa el motor, no el que escribió el agente. Cuando el agente vetaba algo
que las cuatro reglas duras no vetan, la propuesta quedaba en un estado que dice
aprobada llevando dentro un veto, y tanto la firma como la integración
automática la rechazaban sin ruido. Es la familia de
[ADR-070](DECISIONS/adr-070-una-autorizacion-no-es-una-denegacion.md): la razón
decidiendo el qué.

**[Seguridad]** `push:run` comprueba que la carpeta del proyecto es la raíz de su
propio repositorio antes de empujar — una subcarpeta publicaría el repo padre
entero. Se le pregunta a git, no al remoto guardado en la base. El generador de
fixes deja de heredar el entorno del operador, y la salida del gate se redacta
antes de persistirse como evidencia.

**[Test]** El arnés de integración monta repositorios git reales. Montaba
carpetas —una función llamada `makeRepo` sin `git init`— y en cuanto esa guarda
preguntó por git se cayeron cinco comprobaciones a la vez: el choque semántico
que [ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md) había
dejado nombrado como no cubierto, esa misma madrugada. Una sexta llevaba tiempo
en verde sin probar nada —afirmaba que el error «ya no dice CRITICAL», lo que se
cumple con el push fallando por cualquier otra causa— y ahora afirma que el push
ocurre.

## 2026-08-24

**[Motor]** El cerco de integración automática mide el **resultado** antes de
integrar: si el fix dejara un archivo por encima del límite de líneas, no se
integra solo y espera firma. El gate corre dentro del worktree de la propuesta y
nadie medía el árbol ya integrado
([ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md)).

**[Motor]** El asiento de una integración deja de leer una autorización como una
denegación. La firma humana se registraba como «denegada por política» sobre
merges aplicados, y el fallo de git de una firma no se registraba en absoluto. La
vía —automática o firmada— entra en el asiento
([ADR-070](DECISIONS/adr-070-una-autorizacion-no-es-una-denegacion.md)).

**[Seguridad]** La lista de archivos que el motor no puede integrar sin que un
humano los mire cubre dos defensas más: la redacción de secretos antes de
persistirlos, y el armado del entorno y las herramientas de todo agente. Con un
criterio explícito que ya no depende de recordar categorías — si cambiar ese
archivo debilita una defensa, entra. Ver [SECURITY-MODEL](SECURITY-MODEL.md).

## 2026-08-23

**[Escaneo]** Un escaneo deja de extinguir hallazgos por ausencia. Lo que no
reconfirma sigue vivo y puntuando; la única vía de muerte es que un agente lo
juzgue obsoleto al drenar, y cada extinción registra su motivo. Nació de dos
hallazgos de la CSP que murieron porque un commit añadió un comentario a su
archivo ([ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md)).

**[Escaneo]** La identidad de un hallazgo pasa a `fichero │ tipo │ símbolo`. El
escáner clasifica sobre un [vocabulario cerrado](TAXONOMIA-DE-DEFECTOS.md)
derivado de los defectos reales del repositorio, en vez de que la clave dependa
del título que redacta distinto cada vez. Aplica hacia adelante
([ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md)).

**[Motor]** El tope por propuesta mide trabajo real —sin la re-lectura del
contexto, que era el 93-96% de lo que lo reventaba— y el generador lleva techo
de 30 turnos con desenlace propio al agotarlo
([ADR-068](DECISIONS/adr-068-tope-mide-trabajo-y-techo-de-turnos.md)).

**[Motor]** Un análisis que no se deja leer se registra como tal y ya no se
disfraza de hallazgo obsoleto
([ADR-066](DECISIONS/adr-066-analisis-ilegible-no-es-obsoleto.md)).

**[Seguridad]** Tres agujeros cerrados por el propio motor y firmados por el
operador, entre ellos `graph:verify` lanzando el CLI sin `guardRun`. Detalle en
[SECURITY-MODEL](SECURITY-MODEL.md).

**[UI]** El modo autónomo por fases completo: drenaje con confirmación de gasto,
[cola de firma en su página](PAGES/firma.md) con filas desplegables, y el
[expediente del motor](PAGES/motor.md) paginado. «Firmar» queda reservado para
lo que integra; en el gate el botón dice «Pedir revisión».

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
- [DECISIONS/](DECISIONS/README.md) — las sesenta decisiones
  arquitectónicas (ADR-001 a ADR-060).
- [ROADMAP](ROADMAP.md) — las direcciones próximas.
