# Roadmap

Este documento describe las direcciones próximas de FORTRESS. **No lleva
fechas de compromiso.** El proyecto sigue una disciplina de propone-dispone:
cada incremento se firma cuando está listo y probado en el propio uso, no
cuando un calendario lo dicta. Las áreas listadas aquí están firmadas como
direcciones a trabajar; los detalles de cada una —alternativas, consecuencias y
criterios de éxito— se especifican y registran antes de arrancar.

Las áreas se agrupan en tres tramos, en orden incremental: primero consolidar
lo que ya existe, luego ampliar lo que el sistema sabe hacer, y finalmente
abrir el proyecto al público.

## Consolidación de la plataforma actual

Antes de ampliar, afianzar los cimientos de lo ya construido.

### Sesiones autenticadas

Iniciar sesión con la cuenta del proveedor de IA dentro de la aplicación,
conviviendo con la clave propia —ambas rutas de autenticación siguen siendo
válidas—, con la sesión cifrada localmente y nunca expuesta al proceso de
interfaz. Extiende la doctrina de custodia de credenciales ya establecida (ver
[DECISIONS/](DECISIONS/README.md), ADR-034).

### Cierre e integración del motor

Integrar la firma y el merge del motor de auto-reparación dentro de la
aplicación. Hoy la firma es un merge manual del operador en su terminal, con la
doctrina completa ya definida: verificaciones previas, merge explícito y push
siempre humano. El paso pendiente es llevar ese botón a la interfaz sin cambiar
la doctrina. En el mismo tramo, retirar el loop autónomo antiguo en favor del
motor disciplinado. Ver [HISTORY](HISTORY.md) y
[FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).

## De auditor a plataforma de desarrollo asistido

FORTRESS nació como auditor y reparador disciplinado. La dirección de fondo es
convertirlo en un entorno de desarrollo asistido completo, siempre con los
mismos frenos: lo reversible avanza con firma por lote, lo de alto impacto pasa
por un espacio de trabajo aislado, un gate y un revisor.

### Modo asistido

Pedirle a FORTRESS desde su interfaz cualquier tarea de desarrollo, no solo la
reparación de un hallazgo. Las tareas de bajo riesgo se firman por lote; las de
alto impacto siguen el mismo patrón que la auto-reparación —generación en un
worktree aislado, gate hermético y revisor OMEGA— antes de cualquier merge.

### Operaciones git desde la interfaz

Ramas, merges asistidos ante conflicto, rebase, y un historial con diffs
navegables, sin salir a la terminal. El bloqueo de push por hallazgos críticos
que ya existe se integra como un caso más de la misma disciplina.

### Depuración interactiva

Sesiones de trabajo prolongadas, persistidas y retomables, donde el humano y un
agente iteran sobre un problema real con el proyecto vivo a la vista: leer
archivos, correr tests, proponer una hipótesis y probarla en un espacio
efímero antes de tocar el árbol.

### Generación de código nuevo

Construir una feature desde una intención humana, no desde un hallazgo de
escaneo: un plan que el humano revisa y aprueba, generación en un worktree, gate
y revisor sobre el resultado —el revisor juzga si el plan se cumplió—, y firma
humana antes del merge. La misma disciplina de la reparación, disparada por
intención.

### Refactorizaciones grandes

Cambios que tocan muchos archivos por diseño. Un análisis previo del alcance
que el humano aprueba antes de que se toque una línea, verificación sobre el
diff completo —no archivo por archivo—, y un merge atómico: o entra todo, o no
entra nada.

## Camino a la publicación

La meta que los dos tramos anteriores hacen posible.

### Release público y distribución

Firma y distribución del binario en las tres plataformas de escritorio, y la
preparación del repositorio para publicarse en abierto. La doctrina de cero
telemetría se mantiene intacta: ningún componente accede al código ni a los
datos del usuario (ver [DECISIONS/](DECISIONS/README.md), ADR-056).

### Documentación operativa e integración con los agentes

Completar la documentación operativa que aún falta y, después, integrar el
corpus documental con los propios agentes, para que lo lean de forma consciente
y el sistema sepa de sí mismo lo que su documentación explica. Los documentos
operativos —guía de contribución, resolución de problemas, proceso de release y
puesta a punto de un entorno de desarrollo (`docs/CONTRIBUTING.md`,
`docs/TROUBLESHOOTING.md`, `docs/RELEASE.md`, `docs/DEV-SETUP.md`)— están por
completar en la fase de documentación operativa.

## Camino a grado bancario en toda la aplicación

> **CAMINO COMPLETO el 2026-09-26.** Los seis arcos cerrados —el sandbox con la
> clase A aislada (#1, ADR-092 y ADR-095 enmendado), el prompt que refleja (#2),
> el contrato del hallazgo (#3, ADR-099 a ADR-103), el grafo más allá de JS (#4,
> ADR-104 e higiene), el aislamiento de la clase A por turno (8.1, `fd4b5c2`) y
> toda la aplicación dentro del tribunal y del sistema nervioso (#5, ADR-105)— y
> la decisión D rehecha sobre el main reconstruido (#6, tres partes y los docs).
> Lo que queda es deuda menor, anotada en su sitio (DEUDAS §6.11): cuatro de los
> trece hallazgos de la rama de limpieza, y las ramas viejas conservadas como
> referencia hasta que el operador ordene borrarlas.

*Tramo añadido el 2026-09-21. No sustituye a los anteriores: los ordena por lo
que hoy más pesa.* **Doctrina del tramo: lo que ya existe no se rehace; se le
sube el grado y la profundidad.**

El estándar está fijado (ADR-098 §9): cada parte de la aplicación —Terminal,
motor, LOOP, datos, despliegue— debe ser tan profunda, precisa y robusta como la
página de Escaneo cuando corre dentro de la misma disciplina. Este tramo es la
distancia que falta, y **su orden no es una opinión**: sale de cuatro fuentes que
coinciden.

| Fuente | Qué aporta |
|---|---|
| El **backlog de auto-mejora** | lo que FORTRESS anota que le falta mientras trabaja: 381 observaciones y 711 avistamientos en 7 proyectos |
| [DEUDAS](DEUDAS.md) §6 | las deudas estructurales, con su evidencia |
| **ADR-098** | lo que la ley firmada deja pendiente de otra pieza |
| [INVESTIGACION-FRONTERA-2026](INVESTIGACION-FRONTERA-2026.md) | lo que la frontera externa ya probó, fuente por fuente |

### 1. ~~El sandbox (ADR-092)~~ — **HECHO** `cd6a510` (2026-09-21)

**Construido y en `main`**: merge `cd6a510`, 24 commits, gate 6/6 antes y después
de integrar. Lo que desbloqueó, **medido**: *verificar de verdad* —el gate instala
dentro de la caja: `npm ci` por el proxy de registros, rc 0 en vivo—; *stacks que
no son Node* —la tabla cerrada de registros cubre Python, Rust, Go, Java, Ruby y
PHP, aunque solo npm se midió de punta a punta—; *contención cliente contra
cliente* —dentro de la caja no se ve al vecino ni el HOME salvo la ruta de node,
no se escribe fuera, y la red solo sale a la tabla—; *los hooks del cliente
apagados* en los ocho `git` de FORTRESS; y *fail-closed*: sin bwrap o socat no
corre nada del proyecto. Bash libre (ADR-093 Pieza 3) sigue siendo un arco
aparte. Las tres deudas menores que deja están en [DEUDAS §6.2](DEUDAS.md).

*Lo que sigue era el diagnóstico que lo puso primero, y se conserva:*

**El primero por las cuatro fuentes a la vez.** El backlog: lo que más se repite
es que los agentes **no pueden ejecutar para verificar** —Bash negado o troceado,
el revisor que juzga tests que no puede correr, ninguna forma de validar SQL ni
de instalar dependencias— (5 proyectos, 36 avistamientos solo en su área). DEUDAS
§6 lo lleva como deuda estructural número uno. ADR-098 no puede ejercer sin él ni
la casilla 1(a) ni el agente de datos y despliegue. Y la investigación aporta el
motivo: los incidentes reales de 2025-2026 y dos issues del propio Claude Code,
**cerradas sin plan de arreglo**, que documentan lo que aquí se midió en vivo —
una escritura por Bash esquiva un hook de `Write|Edit`— (§2 de la investigación).

Desbloquea: verificar de verdad, los stacks que no son Node, Bash libre (ADR-093
Pieza 3) y producción bajo firma. **Va antes que cualquier capacidad de salir a
la red**: FORTRESS no cierra hoy la trifecta letal solo porque le falta la
tercera pata, y ADR-098 ya firmó ponérsela (§3 de la investigación).

**Sandbox completo el 2026-09-25** (`fd4b5c2`): el arco cerró la clase B en
`bwrap`, pero la clase A —el CLI del agente— seguía con el HOME real y su
servidor del grafo veía los índices de todos los clientes (DEUDAS §8.1, 134
instancias medidas). Cerrado con la enmienda firmada a ADR-095 pieza B: el
servidor del grafo de cada turno recibe `CBM_CACHE_DIR` a un directorio con una
copia real del `.db` del proyecto, en los dos caminos (`withGraph` y el `GRAPH`
del motor), con rechazo legible de lo que no está y sin que el `.mcp.json` del
proyecto pueda saltárselo. La promesa «el código de un cliente no ve al de otro»
queda sin excepción, probada en vivo con huella idéntica de la caché real.

### 2. ~~Que el prompt le diga la verdad al agente~~ — **HECHO** `00656fa` (2026-09-22)

**Construido y en `main`**: merge `00656fa`, 3 commits, gate 6/6 antes y después.
Doctrina del arco: el prompt no *afirma* capacidades, las *refleja* de la fuente
real, y un test derivado por fuente caza la desincronización. Lo que corrigió,
**medido**: el analista decía «NO tienes Bash» y los cuatro agentes del motor lo
tienen (medido en vivo con sus args exactos); ahora el bloque se lee de
`--disallowedTools` de las mismas flags que se lanzan, y dice que corre
contenido por la caja (ADR-092). El vocabulario del grafo concedía once
herramientas y el servidor fijado expone ocho: las cuatro fantasma salieron del
allowlist y de los prompts, la lista se fija por versión y un test vivo la cruza
con el binario instalado. El brief decía «NO tiene doctrina de seguridad» donde
solo había buscado nombres exactos: ahora dice «no encontré ... en las rutas
conocidas» y las nombra. Cierra en la raíz la señal de 130 observaciones y 243
avistamientos de la herramienta fantasma (6 proyectos).

*Lo que sigue era el diagnóstico, y se conserva:*

La segunda señal del backlog, y barata. El prompt afirma *«NO tienes Bash»* y el
agente lo tiene; nombra una herramienta del grafo que el servidor instalado no
expone; dice que un proyecto no tiene doctrina de seguridad cuando tiene un
`SECURITY.md`. Es la premisa heredada —la lección de `--allowedTools`— del lado
del agente: se audita cada prompt contra lo que de verdad se lanza.

### 3. ~~El contrato del hallazgo~~ — **HECHO** `fd9c2c9` (2026-09-23)

**Hecho y en `main`**, cada pieza con gate 6/6 antes y después:

- **Sub-pieza 1, el backfill de las zombis** — merge `b4eed4a`. Las 98 filas de
  mailbd con la identidad de antes de ADR-067 (`severidad|fichero|titulo`) están
  resueltas **en la base viva**: 62 re-identificadas y fundidas con su gemela
  (paso A) y 36 juzgadas por lote dentro de la caja (paso B: 36 REAL con tipo e
  identidad de hoy, 2 fusiones ADR-071, nada muere sin que `estaProbado` lo
  confirme). **Cero identidades viejas vivas en toda la base**; las 29 que
  quedan están EXTINCT. La herramienta corre por proyecto y con `--base`, ensaya
  sobre copia, y la red de invariantes vive en `src` con test; la fusión entera
  es innegociable.
- **Sub-pieza 2, los hermanos, corte 1** — merge `da5238e`, **ADR-099 firmado**.
  Los hermanos son contexto para el juicio, no una decisión: se citan primero
  por SEDE (mismo fichero y símbolo, o a 3 líneas; candidatos a ser el mismo
  defecto) y después por CLASE dicha como tal, y `otro` no agrupa. Medido antes:
  `send-invoice` tenía seis filas vivas para un defecto y no se veían entre sí;
  el 97 % de las citas por clase caían en otro fichero; `otro` agrupaba 34 en
  un proyecto.
- **Sub-pieza 3, los tipos de auditoría** — merge `bd51aee`, **ADR-100 firmado**.
  Seis tipos nuevos en una tercera lista —`accesibilidad`, `privacidad`,
  `integridad-de-negocio`, `continuidad-y-backups`, `dependencia-vulnerable`,
  `criptografia-debil`—, cada uno pedido por filas reales, con dos desempates,
  y el bloque del prompt emitido solo. Y el re-tipado **en la misma entrega**
  (ADR-100 §5): las 108 vivas en `otro` juzgadas por lote en la caja de cada
  proyecto, 103 re-tipadas (87 a los seis nuevos, 16 a tipos de seguridad que
  ya existían), 2 fusiones y 5 que siguen `otro` con razón honesta. **`otro`
  pasa del 20 % al 1 % de lo vivo** (108 → 5), aplicado en la base viva y
  verificado fila a fila contra su backup. Medido antes: los temas de `otro`
  eran los módulos M9, M3, M8, M2 y M4 de ADR-083 sin sitio en el contrato, y
  «calidad de código» eran dos títulos.
- **Cortes 2 y 3 de los hermanos: la memoria del escáner y el alias de clave** —
  merge `aeb6b88`, **ADR-101 firmado**. Dos palancas, sin tocar la identidad de
  ADR-084. **Palanca 1, la memoria de la parada**: cada pasada recibe las vivas
  ya registradas de su alcance como `fichero:linea tipo` y conserva tipo y línea;
  una fila por defecto solo en el mismo sitio exacto, y en líneas distintas se
  reporta cada sitio (juntarlos no es del escáner). Solo prompt, ni clave ni
  sync. Medido en ocho corridas: **deriva 0** (0 sustituciones de tipo, 0
  facetas), recall 25/27. **Palanca 2, el alias de clave**: la tabla
  `finding_aliases`; el sync la consulta solo al fallar la clave exacta y toca a
  la superviviente, nunca a una absorbida; toda fusión registra la clave que
  retira como alias de la ganadora, y el alias no caduca. El **corte 2 queda
  cerrado dentro**: el analista dice `mismoDefectoQue` solo con los ids que se le
  citaron, y FORTRESS lo persiste como fusión más alias; si el objetivo se
  absorbe, la propuesta caduca diciendo con quién. Y el lote (ADR-101 §5) **en
  la misma entrega**: los 96 pares de misma sede o misma línea juzgados por lote
  en la caja de cada proyecto, 33 MISMO / 63 DISTINTOS / 0 sin decidir, **22
  fusiones** con 26 absorbidas y 26 alias, vivas 526 → 500, aplicado en la base
  viva y verificado fila a fila contra su backup. Medido antes: la sede como
  identidad se rechazó con datos (7 de 32 pares de misma línea eran defectos
  distintos), la deriva era estructural (el escáner no tenía memoria) y una
  fusión entre claves distintas la deshacía el sync sin alias.
- **Ancla frente a arreglo: el guard del arreglo fuera de la correa** — merge
  `5f76a44`, **ADR-102 firmado**. El ancla sigue siendo un solo lugar y la
  identidad no cambia. Lo que cambia es que el análisis dice, en una clave
  estructurada `arreglo` (fichero y línea), dónde VA el cambio; y el Motor,
  con la correa y el terreno ya calculados y ANTES de pagar el generador, la
  contrasta con la misma regla que juzga el diff después. Si no cabe, rechaza
  con motivo propio (`arreglo_fuera_de_correa`), **no reintentable**, que lleva
  la huella de `.fortress/config`: el hallazgo no vuelve a la baraja hasta que
  el terreno declarado cambie, aunque el HEAD cambie a diario; el camino
  dirigido se la salta, como siempre. La correa **no se ensancha** (ADR-012
  intacto). Si el analista no declara el arreglo, se genera como hoy y el Libro
  lo cuenta. Los frenos de gasto son la cuarta familia innegociable. Medido
  antes: 61,87 $ hundidos en tres anclas donde el fix no cabía, 49,71 $ en
  `run-genesis.ts:32` (16 propuestas en ocho sesiones, ninguna un reintento);
  con el guard y la pausa habrían costado un análisis, alrededor de 1,50 $.
  **Queda anotado, sin construir**: la columna «dónde se arregla» en el
  hallazgo y la vista «declara / arregla», infraestructura sin consumidor
  medido (el Terminal arregla donde encuentra y la extinción acertó en el único
  caso); y el **patrón A, «línea que ya no es»** (11 observaciones: el ancla
  cae en un comentario o una llave porque el fichero creció por encima), que es
  deriva de línea, pieza de identidad y reanclaje aparte, no de ancla frente a
  arreglo.
- **Severidad por familia: los ejes de seguridad no juzgan lo que no es de
  seguridad** — merge `fd9c2c9`, **ADR-103 firmado**. La premisa de ADR-100
  §4 («accesibilidad queda `sinEjes` y manda la palabra del modelo») era falsa:
  medido, cero hallazgos sin ejes en 12 escaneos, porque el contrato obligaba a
  elegir ejes para todo y el modelo los inventaba para un contraste (el mismo
  4,08:1 salió HIGH en un proyecto y LOW en otro). Ahora los **seis tipos de
  auditoría no pasan por la tabla de ADR-080**: manda la palabra del modelo, los
  ejes que vengan de más se ignoran, la fila se marca `ejesNoAplican` aparte de
  `sinEjes` (que sigue midiendo la calibración de seguridad), el contrato pide
  no poner ejes y da una **guía de orientación**, no de derivación, a las dos
  familias con escala (accesibilidad: nivel WCAG y tarea bloqueada; privacidad:
  clase de dato y a quién se expone). Y el **lote** (`severidad:plan` y
  `severidad:aplicar`, patrón seguro) restauró el juicio del modelo en las **48
  filas vivas** cuya banda la había puesto la tabla, leído de las notas del
  Libro: 36 bajan y 12 suben, el único CRITICAL de familia vuelve a MEDIUM,
  aplicado en la base viva y verificado fila a fila contra su backup. Los ejes
  por familia quedan anotados: solo dos de las seis tienen escala medible.

**Cerrado el 2026-09-23.** Seis piezas construidas con ADR firmado, cada una
medida antes y gateada después: la identidad y el backfill de las zombis
(ADR-084, sub-pieza 1), los hermanos (ADR-099), los tipos de auditoría
(ADR-100), la memoria del escáner y el alias de clave (ADR-101), el ancla frente
al arreglo (ADR-102) y la severidad por familia (ADR-103). Cinco piezas medidas
y anotadas con dato, sin construir: el corte 2 absorbido en ADR-101, la columna
«dónde se arregla», el defecto a propósito, las cadenas de explotación y el
patrón A. Cada hueco del diagnóstico quedó resuelto o descartado con medición.
**Siguiente arco: #4, el grafo más allá de JavaScript.**

**Anotado con dato, no construido**:

- **El patrón A, «la línea que ya no es»** (DEUDAS §6.5, 2026-09-23): 6 de 40
  vivas de FORTRESS con el ancla en un comentario de un fichero que cambió; 0 en
  clientes, que son instantáneas estáticas; 0 duplicados por línea tras el lote
  del alias; daño solo en tiempo del analista, que relee. Reanclar por símbolo
  queda rechazado con dato (1 de 5 pares de misma sede eran defectos distintos).
  **Con condición**: medir la deriva de línea en el próximo escaneo de FORTRESS
  con `medir:deriva`; si la palanca 1 no la mata, el lote del alias automático
  tras cada escaneo.
- **Medido y anotado, no construido**: las **cadenas de explotación** (DEUDAS
  §6.4, 2026-09-23). Las «3 observaciones» eran coincidencias de la palabra
  «cadena»; la real es una (Trade99PRO) y la única instancia en la base tiene
  sus dos eslabones ya CRITICAL, así que no cambia score, push ni orden. Sin
  consumidor y con el coste más alto del contrato. Se reactiva si aparece una
  cadena cuyos eslabones no sean ya CRITICAL por sí solos. Aparte queda el
  patrón repetido en N ficheros (DEUDAS §6).
- Anotado hasta que aporte: los **ejes por familia** (ADR-103 §1.5), cuando un
  proyecto suba del suelo o un CRITICAL de familia bloquee un push por sí solo.
- **Medido y anotado, no construido**: el **defecto declarado a propósito**
  (DEUDAS §6.3, 2026-09-23). Los 5 casos del backlog eran riesgos aceptados por
  escrito, ya EXTINCT; en clientes cero daño; el único plantado es el rig
  `ensayo-fail-closed`; `false_positive` ya saca del audit, del push, del Motor y
  del Terminal; 4 descartes en toda la historia. Sin consumidor. Si un cliente
  trae fixtures vulnerables a propósito, la exclusión por ruta en
  `.fortress/config` es la pieza barata. De paso salió una deuda real aparte: el
  score del escaneo cuenta los descartados (DEUDAS §6).
- Infraestructura anotada hasta que aparezca quien la lea: la columna «dónde se
  arregla» y la vista «declara / arregla» (ADR-102 §1.5).

*Lo que sigue era el diagnóstico, y se conserva:*

Los 27 tipos son todos de seguridad: accesibilidad y privacidad caen en `otro` y
pierden identidad entre escaneos. No se puede expresar una cadena de explotación,
ni un defecto declarado a propósito, ni la diferencia entre dónde se declara un
defecto y dónde se arregla. Y agrupar «hermanos» por clase empareja defectos que
no son el mismo.

### 4. ~~El grafo, más allá de JavaScript~~ — **HECHO** `686b212` (2026-09-24)

**Medido primero, y la premisa era falsa** (2026-09-24, sobre la caché del grafo
y los repos en disco): el binario fijado trae 156 gramáticas y ya indexa `.py`,
`.sql`, `.prisma`, `.tf` y la configuración de la raíz; la cobertura por
ficheros va del 94 al 99 % salvo Omega (45 %). Lo que de verdad no ve, y donde
anclan **134 de las 492 vivas (27 %)**: los directorios ocultos (`.claude/`,
`.fortress/`, `.husky/`: la superficie de las barreras), las carpetas que
`.gitignore` excluye aunque estén versionadas (`legacy/` de Omega, el 79 % de
sus líneas), las políticas SQL, `GRANT` y buckets (la gramática las conoce, el
extractor no las emite), los handlers inline que funde en una función, y los
proyectos sin índice. La 0.11.0 se midió aislada: tampoco ve ocultos ni
políticas; trae 17 herramientas, nodos `Table` y un daemon por cuenta.

**Pieza A, construida y en `main`** (ADR-104 firmado, merge `a152a32`, gate 6/6
antes y después, 10 mutantes muertos), solo prompt: el aviso «lo que el grafo NO
indexa» con las tres superficies medidas y el camino (Read y Grep) en los **tres
bloques grafo primero** (chat, escáner y analista, heredado de una sola base); y
el **bloque de barreras declaradas** al escáner y al analista, leído de lo que
el pre-vuelo ya parsea (hooks `PreToolUse` con matcher, guion, intérprete y si
arranca; `.fortress/config` presente o ausente), saneado, y sin una línea cuando
no hay nada declarado. Los handlers inline quedan en DEUDAS §6 con su dato, no
en el prompt. La 0.11.0 queda como **arco futuro por frescura**, no por
cobertura.

**Pieza B, higiene del índice, construida y en `main`** (sin ADR, merge
`686b212`, gate 6/6 antes y después, 9 mutantes muertos), con las tres causas
medidas antes de tocar nada. `has_graph` tenía dos escritores y ningún lector:
lo ponía solo el botón de instalar y el reconcilio por sha nunca lo tocaba, así
que estaba en 0 en seis proyectos con índice y en 1 en el único sin él; ahora
el reconcilio mira el `.db` antes de decidir, alinea la bandera con el disco, y
un índice ausente se reindexa aunque el sha coincida (mailbd llevaba desde el
29 de agosto «alineado con HEAD» sin índice, porque la caché entera renació ese
día sin que conste quién la borró). El reindex ya era determinista por sha en
arranque, foco, chip y cierre de lote; los huecos (un pull o merge de fuera con
el proyecto ya enfocado, y la integración del Motor) los cubre el **reindex al
volver a la ventana**, sin daemon. mailbd quedó indexado en la máquina con el
binario fijado (1232 nodos, 148 ficheros; huella de la caché idéntica salvo su
`.db`). Y un intruso cazado: el servidor 0.9.0 pone un vigilante sobre su cwd al
arrancar por stdio y reindexa el proyecto si ya está en la caché, y el test del
vocabulario lo arrancaba con el HOME real y cwd en el repo, así que **cada gate
reindexaba FORTRESS en la caché real del operador**; ahora arranca con HOME
propio y cwd vacío, y la suite unitaria ya no toca la caché (huella idéntica en
tres corridas). Al confirmar la huella sobre `main` apareció un **segundo
intruso, anterior (desde el 26 de agosto)**: el check «Loop blindado» de la
suite de integración enciende un loop real sobre el repo propio, el motor lanza
el juez del alcance (`claude -p`) antes de que llegue la parada, y la app sale
sin matar a sus hijos: el juez queda huérfano hasta dos minutos con el servidor
del grafo vigilando el repo, y reindexa cuando ve cambios (medido: 14:11:20Z
del 24-sep). **Arreglado y en `main`** (merge `f836f14`, gate 6/6 sobre `main`
con las tres pruebas: 0 huérfanos tras el gate, 0 conexiones MCP nuevas desde
el repo, huella de los ocho `.db` idéntica): la parada se honra antes de
reservar el carril, un hijo que nace tras la parada muere al nacer, y
`will-quit` mata a todos los hijos. El sangrado, medido en DEUDAS §5.5: 275
conexiones del grafo desde el repo entre el 26 de agosto y el 24 de septiembre,
170 de ellas con la vida del juez (60 a 180 s), jueces `claude -p` gastando el
plan sin que nadie los pidiera. Trade99PRO sí está en disco pero no es
repositorio git ni de confianza: anotado en DEUDAS §6.

**Cerrado el 2026-09-24.** A: el agente sabe qué no ve el grafo y qué barreras
declara el proyecto (ADR-104). B: la contabilidad del grafo dice la verdad y el
índice se realinea solo. Y el 2026-09-25, el aislamiento del grafo por turno
(DEUDAS §8.1, `fd4b5c2`): el sandbox del arco #1 queda completo, clase A y B.
**Y el 2026-09-26 se cerró el #5** (abajo): cuatro sub-piezas construidas, cuatro
anotadas con dato y condición, más la higiene del COGNITION-LOG cazada por el
camino. Y el #6, re-medido el 2026-09-26 y rehecho sobre main por partes, se
cerró ese mismo día con los seis docs a mano: **el camino está completo.** La
0.11.0 sigue como arco futuro por frescura.

### 5. Toda la aplicación dentro del tribunal y del sistema nervioso

**ARCO CERRADO el 2026-09-26.** Construidas: #1 la guarda de barrera para todo
turno que edita (ADR-105), #2 los cuatro flujos de `plan` a `lectura`, #3
Construir observa, #4 LOOP observa sus paradas y standbys, más la higiene del
COGNITION-LOG. Anotadas con dato y condición de reactivación: #5 Cognition
(DEUDAS §6.6), #6 el tribunal en el Ejecutor de Construir (§6.8), #7 el `stderr`
del Terminal como fuente (§6.9) y #8 las notas al chat y al workflow (§6.10).
Cada sub-pieza resuelta o anotada con dato; ninguna infra sin consumidor.

Medido por sitios de llamada: Escaneo y Terminal autónomo corren la disciplina
completa. **Cognition no escribe una sola observación** (Construir sí, desde la
sub-pieza 3; LOOP observa lo suyo, sus paradas y standbys, desde la sub-pieza
4); Construir no tiene crítico ni juez; ~~cuatro flujos siguen en el modo que
bloquea el grafo~~; ~~y un turno suelto en autónomo edita sin pasar por la
guarda de barrera~~. Se conecta órgano por órgano, en ocho sub-piezas.

**Sub-pieza 1 HECHA el 2026-09-26** (ADR-105, merge `4dbaa1b`): la guarda de
barrera cubre los tres flujos que editan. En el chat —turno suelto, lote y
workflow, sin distinguirlos— cuando el proyecto corre en autónomo y el turno va
por el CLI; en el Ejecutor de Construir siempre, negado sea cual sea el modo y
con el recibo en el historial. La observación se asienta en los tres, bloquee o
no. ~~Quedan: 5 Cognition al COGNITION-LOG; 6 OMEGA y crítico en el Ejecutor; 7
el `stderr` del Terminal y 8 las notas del chat~~ (las cuatro anotadas el
2026-09-26: DEUDAS §6.6, §6.8, §6.9 y §6.10).

**Sub-pieza 2 HECHA el 2026-09-26** (merge `22a5fdd`, sin ADR: es el bug 2
repetido): los cuatro flujos que corrían en `plan` —el Plan de Construir, la
entrevista de configuración, el episodio de aprendizaje y el borrador del
agente— pasan a `lectura`. Ven el grafo, y «solo lectura», que sus docblocks ya
declaraban, se hace verdad. **Dato del mapa corregido:** el mapa decía que ni
`plan` ni `lectura` quitan Bash y que el único cambio era que el grafo
responde. Falso: `plan` regalaba Bash sin constar en ninguna lista y `lectura`
lo quita por `--disallowedTools` (`build-allowed-tools.ts:64-66`, medido el
2026-09-20). El cambio hace dos cosas: el grafo responde y Bash queda fuera.
Decisión del operador, con dato: el planner nunca planeó con Bash (su única
corrida falló, 0 planes), `auditoria` habría permitido escribir en el proyecto
por redirección (12-sep) y el sandbox no lo impide.

**Higiene del COGNITION-LOG HECHA el 2026-09-26** (merge `2dfb070`, sin ADR,
cazada al medir la sub-pieza 5): cada gate escribía una sesión falsa «sin
hallazgos, score 100» en el COGNITION-LOG del repo propio, porque la suite lo
registra con su ruta real, el escaneo nace parado y se cerraba con cero
paradas. La condición es «solo lo visto»: con 0 paradas hechas no se escribe
memoria; un escaneo detenido a mitad con una parada hecha conserva la suya
(`escribir-memoria.ts`). El gate lleva desde entonces una **cuarta prueba**: el
conteo de sesiones del log propio no cambia (59 → 59 medido sobre main). Las
31 sesiones falsas ya escritas son limpieza aparte del fichero del operador,
con copia previa, pendiente de orden de Jojo.

**Sub-pieza 3 HECHA el 2026-09-26** (merge `2266922`, sin ADR: calco): Construir
observa. Los tres prompts —investigación, plan y ejecutor— piden notas por
**bloque** (calco del juez, no del escáner: responden prosa y ninguno emite en
vivo) y los tres flujos las asientan por el cuello único `asentarNotas` justo
tras la corrida, **pase lo que pase con el resultado**. El bloque se quita del
texto antes de guardarlo en el `docs/` del cliente y de mostrarlo
(`sinBloqueDeNotas`). Solo la entrevista de configuración sigue fuera, por
emitir en vivo. Queda aparte, distinta de las notas, la deuda de los **denials
del ejecutor** (DEUDAS §6.7).

**Sub-pieza 4 HECHA el 2026-09-26** (merge `ff59bcd`, sin ADR: calco de las
barreras) y **RETIRADA el 2026-09-30 con el LOOP** (ADR-107): el código se fue,
las dos áreas del vocabulario se **conservan** porque las notas ya escritas las
llevan y sin ellas no se leerían. Lo que hizo, para la historia: LOOP observa sus paradas y sus standbys **del dato duro**, no del
modelo: el motivo cerrado y la cifra que ya se guardan en `loop_sessions`, y la
causa del standby clasificada. Dos áreas nuevas, `parada-del-loop` y
`standby-del-loop`, porque la dedup funde por tipo y área y un solo cajón
enterraría juntos los topes y las caídas del proveedor. La clasificación
distingue límite real de decisión humana: los topes y la falta de avance son
limitación, romperse es bug, y parar a mano o terminar resuelto no observan
nada. El texto crudo del error del proveedor queda fuera de la nota: baila en
cada reintento y puede llevar rutas del cliente.

### 6. Mergear lo ya hecho

Parte de lo que falta está escrito y sin integrar: trece hallazgos del
auto-escaneo se cierran solos al mergear la rama de limpieza. Es una decisión del
operador, no un trabajo.

**Re-medido el 2026-09-26 contra `f874c0b`** (DEUDAS y memoria del día): las dos
ramas nacen del 20 de septiembre y main lleva 157 commits por delante; B está
apilada sobre limpieza; ninguna mergea en seco (21 y 25 bloques de conflicto);
tres ideas de limpieza ya estaban en main por otra vía; el miedo de «reabrir
pausados» murió por dato (los merges del día ya levantaron los 17 bloqueos y
nada corre sobre FCC). Decisión del operador: **rehacer sobre main, por partes**,
no mergear.

**Parte 1 HECHA el 2026-09-26** (merge `4dbf512`): diez cherry-picks de la rama
de limpieza, cada uno con rojo previo, verde y gate. El HIGH del enlace colgante
cerrado en código (path-traversal: `rutaContenida` guarda siete escritores del
proceso principal, fuera de la caja del CLI, y `existsSync` seguía el enlace),
las cuatro reglas de forma de secretos que main no tenía (AWS, Slack, JWT de
tres segmentos, PEM acotado), los tres innegociables que protegen a quien aplica
la lista, y las siete de accesibilidad con test de fuente. **Los ocho hallazgos
más el HIGH siguen ABIERTOS en la base:** el cierre es la parte 3, con el kit.

**Parte 2 HECHA el 2026-09-26** (merge `1076666`): B rehecha sobre ADR-105, con
mejora. Las tres puertas del envío niegan con su nombre (barrera, plan sin
aprobar, carril) y el reventón sigue siendo error; la cola del lote corta en la
primera negativa, porque la barrera es del proyecto y el tope del día, no del
hallazgo; el negado no cuenta como procesado; y el parte persistido dice qué
barrera está rota, con el intérprete que falta y el que existe, en los dos
recibos, el del chat y el del Ejecutor. Además el saneado de hermanos y símbolo
sobre la estructura de ADR-099, y el hallazgo lateral cerrado: la nota de
barrera del sistema nervioso lleva el matcher, el guion y el intérprete del
cliente saneados y acotados, con la dedup intacta (la nota normal es idéntica).

**Parte 3 MEDIDA, sin tocar la base:** se cierran 10. Nueve por marcador con las
cuatro pruebas del kit y el `estaProbado` real (los siete de accesibilidad, el
de secretos con marcador nuevo y el de fase B, que main arregló por otra vía y
lleva marcador nuevo), y el HIGH del enlace colgante por juicio, porque su
arreglo vive en otro fichero que el ancla. Ensayo en seco sobre una copia: 46
vivos a 36. Quedan 4 de los 13: el script de caducar sin guarda de app cerrada,
el barrido de spawns ampliado, y los dos del login. El kit rehecho no admite la
base viva por defecto y solo escribe con `--aplicar` tras backup validado.

**Parte 3 HECHA el 2026-09-26** (sobre la base viva, con la app cerrada, por
orden del operador): diez hallazgos de FORTRESS cerrados en la base, nueve por
marcador verificado en el momento contra main con el `estaProbado` real y el
HIGH del enlace colgante por juicio; 567 filas de otros proyectos idénticas,
21 tablas sin cambio, integridad ok; verificado fila a fila contra el backup
validado que el kit dejó antes de escribir. FORTRESS pasa de 46 vivos a 36.

**Los seis docs, rehechos a mano el 2026-09-26** (`34e088a`), midiendo qué
decía cada uno que main no reflejaba y trayendo solo eso: el glosario decía que
`isAbsoluteProjectPath` no rechaza `..` y el código lo rechaza; el flujo del
chat y la página del Terminal seguían describiendo el freno por palabras que
ADR-089 retiró; el flujo del escaneo daba la identidad vieja; AGENTS no tenía
al Crítico ni al juez de aplicabilidad; DATA-MODEL decía 19 tablas y son 22; y
el changelog acababa el 13 de septiembre y va hasta el 26.

**ARCO #6 CERRADO.** Deuda menor, anotada en DEUDAS §6.11: de los trece
hallazgos que la rama de limpieza tocaba, cuatro esperan a fases posteriores
(el script de caducar sin guarda de app cerrada, el barrido de spawns ampliado
que depende del gitEnv descartado, y los dos del login); y las ramas viejas
`limpieza/escaneo-2026-09-20` y `fix/lote-negado-deja-constancia` se conservan
como referencia, borrables cuando el operador lo diga.

### Lo que la auditoría del 27 de septiembre ordena arreglar

Los seis arcos cerraron el camino. La auditoría end-to-end de `src/domain` entero
mide lo que quedaba debajo: 118 hallazgos, todos anotados en
[DEUDAS §9](DEUDAS.md). **Cuatro son urgentes de seguridad**, y se arreglan de uno
en uno con el método completo — medir, test rojo, mutante, gate y verificar el
efecto en vivo — porque tres de ellos tocan código recién integrado.

- **1. ~~El 100/100 en minúscula~~** — **HECHO** `26f4db4` (2026-09-27). Un
  informe cuyas entradas se caían todas pasaba por «proyecto limpio». La medición
  encontró **tres** bugs y no dos: el guard de severidad distinguía mayúsculas, el
  parser devolvía lista vacía en vez de error, y el cierre escribía el score en el
  tablero sea cual fuera el motivo. Se arregló entero, más el rescate de las notas
  del sistema nervioso, que antes morían con el informe.
- **2. ~~El saneador de prompts~~** — **HECHO** `3810e5c` (2026-09-27), y resultó
  ser **más grave que el primero**. El hueco no eran cinco caracteres sino
  diecinueve de veintidós, y la medición destapó un vector de inyección completo:
  un salto de línea normal en el título de un hallazgo del repo auditado forjaba
  las instrucciones del prompt del generador, el único agente con permiso de
  escritura, escribiendo un `NO_TOCAR` y un `PERMITIDOS` falsos que contradecían a
  los reales. Se cerró en la única barrera compartida, que cubre los catorce
  sitios de golpe, con una excepción medida: el juez del plan conserva sus líneas,
  porque lo que juzga es la prosa del productor y esa es el objeto del juicio, no
  un campo. De paso se cerraron las cuatro copias del neutralizador de marcas y
  una fuga de la copia del grafo cuando el proceso no llegaba a lanzarse.
- **3. ~~`PGPASSWORD=` no se tacha, y un SHA de git sí~~** — **HECHO** `4fc30c0`
  (2026-09-28). No eran dos defectos opuestos sino TRES piezas, y la tercera solo
  la vio la medición. El primero era una familia de trece secretos con el prefijo
  pegado al nombre. El comodín que tachaba cualquier hexadecimal largo se retiró
  entero: había nacido para la línea en vivo, con la nota «no se persiste» escrita
  en su propio commit, y había derivado a diecisiete sitios donde sí persiste,
  borrando del recibo la huella que un auditor necesita. Y retirarlo abría tres
  agujeros, porque tapaba por accidente tres credenciales que se reconocen por el
  sitio donde viven; ahora se cubren por diseño, conservando la línea legible.
- **4. ~~La nota de parada del LOOP viaja en crudo~~** — **HECHO** `b949c34`
  (2026-09-28). Era la única rama del sistema nervioso que metía texto libre: su
  gemela clasifica doce líneas más abajo y las cuatro hermanas derivan todas de
  dato clasificado. Costaba tres cosas a la vez: la nota bailaba y sembraba diez
  avistamientos donde debía haber uno, no tenía tope, y llevaba nombres de tabla y
  correos del cliente que el cerco no alcanza. Ahora sale de tres ejes cerrados, y
  la privacidad es por construcción: el código solo entra si tiene forma de código
  de sistema. El mensaje entero se queda donde el operador lo ve y no se exporta.

**LOS CUATRO URGENTES DE LA AUDITORÍA: CERRADOS Y VERIFICADOS EN VIVO.** Y la
medición corrigió el hallazgo las cuatro veces, así que ninguno se cerró con el
arreglo que el informe proponía. El hallazgo dice dónde mirar, no qué construir.

**El gate, arreglado por el mismo principio.** Al probar el determinismo con la
suite entera aparecieron dos tests intermitentes, y medir la clase dio 44 ficheros
que lanzan procesos reales con una sola causa: el techo por defecto no aguanta
arrancar un proceso con 862 suites compitiendo. Se arregló la causa con una línea
y no los casos con 41 parches, porque los parches no cubren el fichero que alguien
escriba mañana. Cuatro pasadas de la suite completa, las cuatro estables.

No son arcos nuevos del camino; son la letra pequeña que el camino dejó abierta, y
el orden lo fija la gravedad medida, no el orden en que se encontraron. Y la
gravedad se ha reordenado en los TRES: el primero eran tres defectos y no dos, el
segundo resultó ser el peor de los cuatro, y el tercero eran tres piezas donde el
informe veía dos, con la tercera necesaria para que arreglar las otras no abriera
un agujero nuevo. Medir antes de construir no solo confirma el hallazgo; a menudo
lo corrige, y dos veces ha cambiado qué se construía.

### Lo que la investigación añade como profundidad — no son arcos nuevos

- **Recibos verificables criptográficamente**, sobre el recibo que ya existe
  (ADR-093 Pieza 1): los modelos dicen lo que de verdad hicieron entre un 25 % y
  un 39 % de las veces, así que se juzga lo hecho, no lo dicho.
- **Memoria por agente** (el campo `memory` del CLI). Existe, y tiene un fallo
  reportado, cerrado sin arreglo, justo con la combinación de opciones que
  FORTRESS usa. **Se mide en vivo antes de apoyarse en ella.**
- **El grafo de código al servicio del crítico**, que es donde la evidencia dice
  que más rinde. Se apoya en el punto 4.
- **Cerrar el bucle del sistema nervioso**: FORTRESS observa y funde; le falta
  re-correr una batería fija antes de dar una observación por atendida, con un
  check determinista decidiendo — nunca un modelo juzgando a otro en ese banco.

## Balance del 27 y 28 de septiembre: qué está en producción y qué sigue

**EN PRODUCCIÓN.** Binario `5b8daf3f` instalado el 28-sep 03:52, verificado sin
deriva en los tres eslabones: el binario instalado es el AppImage construido, su
asar es el de la construcción, y su bundle es idéntico al código de `main@32294b1`.
Jojo confirmó el arranque: grafo alineado y los scores diciendo la verdad —un
proyecto con un CRITICAL vivo marca 0, no 100—.

Lo que ese binario lleva dentro, verificado por identificadores:

- **Los seis arcos del camino a grado bancario**, completos: la caja del CLI, el
  prompt que refleja la verdad, el contrato del hallazgo, el grafo más allá de
  JavaScript, el aislamiento de clase A y toda la aplicación dentro del tribunal.
- **La decisión D rehecha** sobre el main reconstruido y no mergeada en seco: las
  defensas de la rama vieja, el recibo del bloqueo con sus saneados, y diez
  hallazgos cerrados en la base viva con verificación fila a fila.
- **Los cuatro urgentes de la auditoría**, cerrados y verificados en vivo.
- **El gate determinista**, arreglado por la causa.
- **Once decisiones firmadas**: la enmienda de ADR-095 y de la 098 a la 105.

**EN MAIN Y NO EN EL BINARIO.** El rebuild del 30-sep metió los cuatro arcos que
esperaban (binario `c3ee4e23` = `main@9405b49`, cero deriva en los tres eslabones,
la trifecta del aislamiento YA EN PRODUCCIÓN). Desde entonces han entrado **tres
más**: la pieza 1 del Motor (`15b7fbf`), los ojos de la huella; **la cura del
perímetro** (`d5e9945`); y **ADR-106** (`4e82c0f`), el debut a HIGH. Los cuatro que sí
llegaron al binario fueron:

1. La correa que el motor usó, que el revisor ya lee del libro de eventos
   (`44a7818`).
2. **El corpus crudo del repo auditado hacia los prompts** (`3c8a77d`): el vector
   era solo la vía DECLARADA en `.fortress/config` —la descubierta es segura por
   construcción—, y medir antes de construir demostró que sanear no rompía ninguno
   de los 24 corpus reales.
3. **La cota de la caja** (`10d3a68`): el `.git` del repo auditado abría el HOME
   entero —y el repo de OTRO cliente— en escritura DENTRO de la caja. Medido con
   un `bwrap` real, porque la pregunta que decidía si era P0 o costura era si un
   `--bind` posterior destapa el `--tmpfs` anterior. Lo destapa.
4. **El analista alineado con el vocabulario cerrado** (`d3abb45`): pedía el área
   en texto libre y era el único de los cinco prompts que no podía clasificar, así
   que sus notas caían al cajón `otro` y la dedup —que funde por `(kind, area)`—
   las dejaba en cinco filas con **196 de 320 avistamientos**: el 16 % de las
   filas con el 61 % de la señal del backlog. Su guardián además no se guardaba a
   sí mismo, y eso lo destapó un mutante que sobrevivió.

**Con la cota de la caja, la TRIFECTA DEL AISLAMIENTO queda cerrada:** los tres vectores
por los que el código del cliente rompía el aislamiento —sus caracteres
(`3810e5c`), su corpus declarado (`3c8a77d`) y su `.git` (`10d3a68`)— eran la
misma clase de error, un dato del repo auditado tratado como fuente de verdad.
**Y corre en producción desde el rebuild del 30-sep**, verificado en el asar por
su CÓDIGO y no por su nombre. El próximo rebuild se lleva la pieza 1 del Motor, la cura del perímetro y ADR-106.

**LO QUE FALTA, por orden de lo que más pesa.**

1. **Los tramos 2 a 7 de la auditoría** (DEUDAS §9.8). Lo hecho cubre `src/domain`
   y un barrido mecánico; falta la infraestructura del motor y del escáner, el
   resto de infraestructura, la aplicación, la presentación —430 ficheros con 74
   tests— y `scripts/`, que son 106 ficheros sin tests que corren sobre la base
   viva. Ese último es el que más asusta de los seis.
2. **~~Los P0 de seguridad de los 118 que no eran los cuatro urgentes~~**
   (§9.2 y §9.3): **CERRADOS.** El corpus crudo (`3c8a77d`), la cota de la caja
   (`10d3a68`) y —el tercero de la lista— el analista, que al medirlo **no era un
   P0**: el embudo ya cerraba su vector, así que era P1 de calidad, y también está
   cerrado (`d3abb45`). Tres de los tres: en los tres la medición corrigió el
   hallazgo, y en uno cambió hasta su severidad.
3. **El residuo del primer urgente** (§9.2): un informe PARCIALMENTE ilegible pasa
   en silencio, y con una entrada buena de diez se pierden nueve sin que nada las
   cuente.
4. **Confirmar el determinismo** en la próxima sesión (§9.1). El techo global ya
   cubre los 44 ficheros, pero el segundo intermitente solo apareció una vez de
   tres, así que la estabilidad se afirma con más superficie, no con cuatro
   pasadas.
5. **Los cuatro de los trece de la decisión D** que esperan (§6.11), el
   SECURITY-MODEL sin una palabra sobre la caja (§8.2), el arco de privacidad del
   fichero de auto-mejora, los seis funcionales de la auditoría (§9.4) y las 35
   erratas de documento (§9.5).

## El arco del MOTOR de auto-reparación (abierto, 2026-09-30)

La misión: que el motor repare a fondo sin caerse por tiempo, **manteniendo las
fronteras** (el **perímetro** de ADR-107 —el Motor solo sobre FORTRESS—, nunca
`origin` sin la firma, `integracionAutomaticaPermitida`, DEBUT, el motor propone
y el humano dispone). `loopBlocked` **ya no figura**: era del LOOP, y ADR-107 lo
retiró con él.

**DIMENSIÓN 1, MEDIDA.** El freno principal es el **techo de vueltas del CLI**
(`--max-turns 30`), y vive **DENTRO** de la corrida: desde fuera no se ve. En
1582 eventos disparó **20 veces** —con el **84-92 % del presupuesto sin tocar**—,
frente a 3 del reloj del generador, 4 del presupuesto (todos de agosto, ya
corregidos al dejar de contar la relectura de caché) y **0 del gate y 0 de OMEGA**.
El motor **para por CONTADOR CIEGO**: la doctrina de convergencia por huella del
diff existe implementada, pero **solo en el Terminal** (`ciclo-de-convergencia.ts`,
«CONVERGER NO ES UN CONTADOR»). Dato que acota la ambición: el motor **nunca ha
intentado un CRITICAL** —177 propuestas: 91 MEDIUM, 82 LOW, 4 HIGH, 0 CRITICAL—.

**PIEZA 1 — LOS OJOS: HECHA** (`15b7fbf`). El motor asienta en el libro la
**huella del trabajo** (`sha1`) de cada corrida del generador, con las vueltas y
el gasto. Detalles que la hacen valer:

- **Los creados van dentro.** Es la lección del Terminal, **reproducida y no
  heredada**: medido aquí, cambiando SOLO un fichero nuevo, la huella sin ellos
  **no se movía**; con ellos sí.
- **El git va en la caja** (ADR-092 clase B). El árbol es de un cliente.
- **Aditivo**: un `DECISION` en el libro, como la correa. Sin migración, sin tocar
  el ciclo, los estados, ni `--max-turns`.
- **No guarda el texto del diff**, solo 40 caracteres.
- **`null` ≠ 0**: cuando nuestro reloj mata al CLI no hay factura, y la evidencia
  lo dice en vez de inventar un cero.

**LA REGLA PARA DECIDIR EL TECHO, cuando haya dato:** dos corridas del MISMO
hallazgo con la **MISMA** huella → *giraba*, y subir el techo **no compra nada**;
con huellas **DISTINTAS** → *avanzaba*, y subirlo **ayuda**.

**EL LÍMITE, SIN ADORNOS: esto mide HACIA DELANTE.** Los 20 casos pasados **no se
recuperan** (queda 1 worktree en disco). Hasta juntar corridas nuevas, la pieza da
la **medida, no la decisión**.

**LA CURA DEL PERÍMETRO — ADR-107: HECHA, MERGEADA (`d5e9945`) Y VERIFICADA EN
VIVO.** Medir la dimensión 2 destapó algo que no era del techo ni de la
severidad: **subir el debut a HIGH habría abierto HIGH sobre proyectos de
CLIENTE**, contra la doctrina de los dos mundos que el operador tenía escrita
desde el 14-sep, y donde la desviación ya constaba con su nombre
(`motor-expuesto-en-proyectos-ajenos`). Lo cerrado:

- **El Motor queda SOLO sobre FORTRESS.** La guarda se pregunta en el
  **NACIMIENTO** de la propuesta —`planRepair` y `retryRepair`, los dos únicos
  sitios que la crean—, no en los bordes: por ahí pasaban los tres disparadores, y
  una guarda por borde depende de que alguien se acuerde del cuarto. Las tres
  piezas entran en los innegociables como **familia propia**
  (`innegociables-perimetro.ts`).
- **El LOOP se elimina de raíz**: **62 módulos** de `src/` fuera —36 de código y
  26 de test— más sus dos guiones de `scripts/checks`. Se **conservan** los dos
  **frenos duros de gasto** —`costCapUsd` y `maxCycles`, **sin default a
  propósito**, «nadie decide por él cuánto está dispuesto a gastar»— en la sección
  **«Topes del motor»** de Configuración, porque el **Drenaje** los usa; y la
  tabla `loop_sessions` **intacta**, porque es historia.
- **La frontera de integración, RESCATADA.** `integracionAutomaticaPermitida`
  vivía en el gate del loop y **nunca fue del loop**: se muda a
  `domain/repair/integracion-sin-firma.ts`. Borrar el loop sin verla se habría
  llevado por descuido el invariante de que el código propio no se integra solo.
- **El cartel en `MotorView`**: un proyecto de cliente ya no ve el Motor, ve a
  dónde ir —«El Motor repara FORTRESS. Este proyecto se repara por el Terminal»—.
- **`mailbd` apagado en la base viva**, por el operador y con la app cerrada:
  `loop_enabled` 1→0 en esa sola fila, 0 flags encendidos, `loop_sessions` 2→2, y
  backup `fortress.db.bak-pre-loop-enabled-2026-09-30`.

**SUPERA A ADR-063, y con respeto.** ADR-063 abrió el Motor a cualquier proyecto
registrado en agosto, y fue **correcto ENTONCES**: no había Terminal de grado
bancario para el cliente. Ahora lo hay, así que lo superado es el **VEHÍCULO**, no
la capacidad. **Lo que se pierde, aceptado por escrito y firmado:** FORTRESS deja
de tener **autonomía continua desatendida**; se repara cuando alguien drena.

**LO QUE QUEDA DEL LOOP, A PROPÓSITO:** `loop_sessions` y su repositorio, el tipo
`LoopSession`, las áreas `parada-del-loop`/`standby-del-loop` del vocabulario de
observación —las notas viejas las llevan y sin ellas no se leerían— y
`read-loop-budget`, que es quien sirve los dos topes al Drenaje. Las claves de
ajuste siguen diciendo `loop*` para no migrar lo que el operador ya fijó.

**DIMENSIÓN 2 — ADR-106: HECHO, MERGEADO (`4e82c0f`) Y VERIFICADO.** El debut sube
a **HIGH** (`DEBUT = ['LOW','MEDIUM','HIGH']`), la **selección prioriza por
severidad** anteponiendo `compareSeverity` a los cinco desempates —que quedan
intactos—, y las **cuatro piezas de la selección** entran en los innegociables
como familia propia. Cayó exacto detrás de la cura: `selectTarget` filtra por el
debut **incondicionalmente** y la guarda del perímetro corre **antes**, en
`planRepair`, así que el único camino que le queda es el **Drenaje sobre
FORTRESS**.

**LA PUERTA DE CRITICAL, CONDICIONADA Y VERIFICABLE:** entra cuando exista una
propuesta de hallazgo **HIGH** en estado MERGEADO con `gate verde`, `omega aprobo`
e `integracion firmada por el operador`, y con `created_at` **posterior al sello
de ADR-106** —sin ese corte la condición nacería cumplida, porque ya hay un HIGH
con esa firma exacta del 19-ago bajo la puerta vieja—. **Hoy solo puede cumplirla
un HIGH de FORTRESS**, y eso la estrecha: medido el 30-sep, el repo propio tiene
**7 HIGH abiertos y 0 CRITICAL —nunca tuvo ninguno—**, mientras los **48 CRITICAL
de la base están todos en proyectos de cliente**, fuera del alcance del Motor. Va
escrito en la **errata §0** del propio ADR, que también retira su mención a
`loopBlocked`.

**CON LA CURA + ADR-106: el Drenaje repara FORTRESS a grado bancario, HIGH
incluido, y CRITICAL con prueba.** Abrir el debut **no abre el auto-merge**: un
HIGH cuya política no lo liste sigue exigiendo la firma del operador para
integrarse. El motor trabaja; integrarlo sigue siendo humano.

**LA ASIMETRÍA DE LOS DOS NACIMIENTOS, CERRADA ANTES DE MERGEAR.** `retryRepair`
ya devolvía su motivo y `planRepair` devolvía `null` a secas, así que sus cuatro
finales sin propuesta se contaban como uno: un proyecto negado por el perímetro
llegaba al operador como «no queda nada elegible». Ahora el motivo viaja **tipado**
(`PlanResult`) hasta el desenlace de la cadena (`negado`), el parte del drenaje y
el aviso de la UI, que dice a dónde ir. Cinco mutantes, uno por eslabón. **No se
escribe en ningún libro y es a propósito:** no hay propuesta a la que colgar un
evento, y asentarlo como observación llevaría el nombre del proyecto del cliente
al export de auto-mejora, contra el cerco de ADR-085.

**Y destapó algo:** desde la cura, **tres checks de integración pasaban por la
razón equivocada**. Decían probar «sin candidato» y «sin ancla», pero su proyecto
vive en `/tmp`, así que el perímetro los cortaba antes de llegar a mirarlo.
Mientras el motivo era `null` no había forma de verlo. Reescritos para decir lo
que prueban; los dos casos que decían cubrir viven donde sí se ejercitan
(`plan-repair.test.ts`, con sus motivos `sin-candidato` y `sin-head-de-git`).

**EL GATE ESTABA CIEGO NUEVE DÍAS, Y ADR-108 LO DEVUELVE A VER** (merge
`39e919e`, HECHO Y VERIFICADO EN VIVO). La intuición del operador —«el Motor
rechaza y Claude Code resuelve»— no destapó un motor cobarde: destapó que **su
gate no podía pasar `npm ci` desde que existe la caja**. Medido sobre
`proposal_events`: **99 de 99 verdes antes del 21-sep, 0 de 3 después**, y las
tres de la noche del 30-sep murieron en `node-gyp` —solo una tocaba
`package.json`; las otras dos eran fixes sin relación—. Choca de frente con
ADR-107, que dejó al Motor **solo** sobre FORTRESS: el único proyecto cuyo gate
la caja no dejaba pasar.

**Lo cerrado: TRES artefactos públicos en la caja clase B**, `--ro-bind`, padres
y nunca por versión —sin entrada del repo, que es el vector de la trifecta—:

| Artefacto | Qué desbloquea |
|---|---|
| `~/.electron-gyp` | `node-gyp configure`, que salía a descargar cabeceras |
| `~/.cache/node-gyp` | las de Node, por lo mismo |
| `~/.cache/electron` | el `install.js` del paquete `electron`, que baja su **binario** de `github.com` |

**Eran DOS fallos, y el segundo solo apareció al probar el `npm ci` COMPLETO.**
Con solo las cabeceras, `npm ci` moría en `getaddrinfo ENOTFOUND github.com`. El
operador amplió su firma al tercero el mismo día.

**VERIFICADO EN VIVO con `bwrap` real y los args REALES de `enCaja`**, sobre el
worktree del fix del Electron: `npm ci` **completo rc=0 en 65 s**, «completed
installing native dependencies», **un solo host en el proxy**
(`registry.npmjs.org`, sin cambio). Y el aislamiento en la misma corrida: **red
NO**, `/media` en 0, `~/.ssh` y `~/.config` inexistentes, escribir en las
cabeceras y en el zip → **EROFS**, y `~/.cache` mostrando **solo** `node-gyp` y
`electron`. **La trifecta intacta.** 5 mutantes muertos —el peor caso es el
montaje escribible: un cliente envenenando la caché que después compila el módulo
nativo de FORTRESS—.

**NO abre red** (la opción ancha —`electronjs.org` en la tabla— se rechazó: la
habría abierto para todo agente sobre todo proyecto con `package.json`, el
Terminal en repos de cliente incluido). **Solo clase B**: los agentes editan, no
compilan.

**CORRECCIÓN FIRMADA al §3.5:** el fix del Electron de anoche **no subía el
ABI** —pinchaba el rango `^39.2.6` → `39.8.10`, y el lock sigue en 39.8.10, cuyo
zip está en caché—. **Ese fix sí lo resuelve el Motor.** Los saltos de major de
verdad siguen fuera, por decisión: `node-gyp` falla en el `mkdir` del devdir en
solo lectura antes de tocar la red, y esos los hace el operador con Claude Code,
fuera de la caja.

**LA SEGUNDA CEGUERA, Y LA HISTORIA ENTERA** (merge `2537fd6`, la via 3 HECHA Y
VERIFICADA). Arreglar el `npm ci` hizo que el gate llegara por fin a `test:unit`
—y ahi aparecio una ceguera **mas vieja y de signo contrario**.

**El gate del Motor no dio un veredicto COMPLETO sobre FORTRESS desde el 4-sep.**
Dos cegueras apiladas, y la segunda tapaba la primera:

| Ceguera | Desde | Efecto |
|---|---|---|
| `test:unit` rojo en la base de todo worktree | **10-sep** | el kit `internal/AUDIT-KIT/` esta en `.gitignore` y no viaja |
| `npm ci` rojo en la caja | 21-sep | ADR-108, cerrada |

**Y EL GATE NO MENTIA: ABSOLVIA, Y LO ANOTABA.** Esta es la correccion que la
medicion impuso sobre lo que creiamos. `gate-sequence.ts` tiene un mecanismo
deliberado y bien razonado: cuando un comando falla, el gate **vuelve a
`baseSha`** y lo corre ahi; si ya estaba rojo en la base y el fix no anade ruido
en sus propios ficheros, no se lo achaca al fix —«exigirle a un fix que deje
verde un arbol que ya estaba rojo antes de tocarlo es pedirle que arregle el
proyecto entero para arreglar una linea»—. Si TODO lo que fallo era heredado, el
gate **pasa**.

Asi que desde el 10-sep `test:unit` se heredaba SIEMPRE, y el gate pasaba con su
comprobacion de tests **estructuralmente apagada**. Medido:

- **44 gates verdes** de FORTRESS; **12 con algo heredado, los doce `test:unit`**
  (1 el 21-ago, 9 el 14-sep, 2 el 19-sep).
- **OCHO fixes llegaron a MERGEADO con los tests sin verificar** —siete firmados
  por el operador el 14-sep—.
- De los **11 rechazos** de FORTRESS, **7 fueron LEGITIMOS** (4 lint, 3
  typecheck, **todos anteriores al 10-sep**): ahi el gate funcionaba y el fix
  fallaba de verdad. **Solo UNO** se rechazo por `gate_failed_at=test:unit`.

**No era un juez ciego que condenaba: era un juez al que le habian quitado una
prueba, que lo anoto en el acta doce veces, y nadie leyo el acta.** El bug es el
OPUESTO al que se supuso: no rechazaba de mas, **absolvia de mas**. Y eso es peor
de ver, porque lo de mas se ve —`RECHAZADO`— y lo de menos no —`VERDE` con una
prueba apagada—.

**LO CONSTRUIDO (la via 3).** Los cinco tests eran **dos clases**: cuatro prueban
el CODIGO —leen ahora una **plantilla sintetica** versionada, escrita PARA el
test, con las cuatro anclas del contrato; **no** un recorte de una real, que
seria producto en git y envejeceria sin avisar— y uno prueba LOS DOCUMENTOS
—`plantilla-contrato`, que sigue leyendo el kit y **se salta DICIENDOLO** donde no
esta—. Con **guardian de codigo** (`contrato-del-kit.test.ts`) que impide la
regresion a «saltar callado»: exige el `skipIf` atado a `kitDisponible`, la razon
impresa, y ningun `return` de escape dentro de un `it`. Seis mutantes muertos.

**Verificado en la condicion exacta del Motor** (`git worktree add`, sin
`internal/`): **865 ficheros verdes, 1 saltado; 4595 tests verdes, 1 saltado,
cero rojos**, y el salto se lee en `stderr` con su razon entera.

**Y dos datos que la medicion corrigio de paso:** el extractor tiene **TRES**
ramas `null`, no cuatro —la falta de `═══ FIN ═══` no devuelve `null`—; y el
contrato exigia «del paso A al I», **falso en nueve de las doce** (los cuerpos van
de **seis** pasos a nueve). Ahora exige lo que si es el contrato —una **tira
seguida desde A**— y recorre las doce: mas estricto que antes.

**AHORA el gate prueba `test:unit` de verdad**, porque en un worktree la base ya
esta verde y la herencia no se aplica. Con ADR-108 (el `npm ci`) y la via 3 (los
tests), el gate del Motor vuelve a dar veredicto sobre FORTRESS.

**DOS COSAS QUE QUEDAN A LA FIRMA DEL OPERADOR** (medidas, sin construir):

1. **Los ocho fixes mergeados con `test:unit` heredado.** Hoy main esta verde
   entero (4632 tests), asi que no quedo nada roto —pero nadie lo comprobo
   entonces—. Auditoria retrospectiva barata.
2. ~~**Que el `heredado` LLEGUE al operador.**~~ **FIRMADO Y CONSTRUIDO** el
   30-sep: **ADR-109**, merge `b1645b9`. Es la raiz: el gate lo anoto doce
   veces y nadie lo leyo. Un verde-con-heredado deberia firmarse SABIENDOLO
   —«paso, pero `test:unit` estaba heredado, no verificado»— en vez de en
   silencio. Mismo principio que la via 3: lo no verificado se **declara donde se
   lee**, no se entierra. Y con ello, **dos docblocks que mienten** en
   `gate-result.ts:32`: la rama `ok:true` dice «hoy un verde no puede traer nada
   heredado» —falso, doce veces— y la `ok:false` dice «rojo es rojo», que
   contradice lo que `gate-sequence.ts` hace.

**LA PRUEBA QUE QUEDA, y es el momento de verdad:** una **corrida real del gate**
sobre un fix ordinario de FORTRESS. El `bwrap` probó que `npm ci` pasa; la
corrida real prueba que **el gate entero** pasa —`typecheck`, `lint`,
`test:unit` detrás—, que es lo que el Motor necesita para verificar un fix.

**Y EL CAMINO DE LA MISIÓN, con el orden que importa:** ADR-108 (el gate vuelve a
ver) → confirmar con la corrida real → **el LAZO** (que el Motor persista
arreglando cuando el gate rechaza, como `claude -p` con `--resume`; medido en
DEUDAS §10.2 y ya construido para el Terminal en `hastaConverger`). El lazo tiene
sentido **solo ahora**: persistir contra un gate ciego no servía de nada.

### El primer fix del Motor, y las CINCO capas que lo tenian parado (2026-10-01)

Todo esto salio de una intuicion del operador —«no me cuadra que el Motor
rechace y Claude Code resuelva»— y de pelar capas una a una. **Eran cinco**, y
cada una tapaba a la siguiente: hasta que no se quitaba la de arriba, la de abajo
no se podia ni ver.

| | | |
|---|---|---|
| 1 | **`npm ci` no pasaba en la caja** | ADR-108, merge `39e919e` — los tres artefactos publicos en solo lectura |
| 2 | **`test:unit` rojo en todo worktree** desde el 10-sep | la via 3, merge `2537fd6` — plantilla sintetica + guardian del kit |
| 3 | **el gate ABSOLVIA la herencia en silencio** | ADR-109, merge `b1645b9` — el heredado llega al revisor, a la firma y al parte |
| 4 | **la firma no leia su expediente** | merge `5a62c8b` — el asiento se busca por su motivo, no por su posicion (DEUDAS §13) |
| 5 | **el merge de la firma con el PATH congelado** | merge `fecdd37` — el entorno se compone al llamar, y el fallo lleva su motivo (DEUDAS §14) |

Las dos primeras eran la **causa** del gate; la tercera es el **mecanismo**, y es
la unica que impide la reincidencia: sin ella, la siguiente prueba que se apague
volvera a pasar por heredada y a anotarse donde nadie lee. La cuarta y la quinta
estaban **detras** del gate, en el camino de la firma, y solo se podian ver
cuando una propuesta llegaba hasta alli: la 4 al pulsar Firmar, la 5 en el
ULTIMO paso de ese mismo gesto.

**LAS DOS CORRIDAS REALES.** El HIGH del Electron (`9e64bb68`) murio en
`no_diff_produced`: el generador no dejo diff. El MEDIUM `fa86739d` fue **punta a
punta**: propuesta **`7998aa13`** sobre `graph-binary.ts`, fix **con su propio
test**, **gate verde limpio en 242 s** —sin un solo heredado—, OMEGA
**APROBADO** con `resuelve_el_hallazgo: PARCIAL`, **$0,97**. La mitad que queda
abierta se anoto ANTES de firmar, en DEUDAS §12.1, porque firmar MITIGA el
hallazgo entero y lo pendiente dejaria de verse.

**Y AL LLEGAR A LA FIRMA, LA CUARTA CAPA.** Pulsar `Firmar` contesto
**`incomplete-state`**. `collectPostOmegaState` buscaba `branch` y `baseSha`
cogiendo **el ULTIMO `GENERATE DECISION`**, y dos arcos **BUENOS** le habian
puesto asientos detras: la correa al libro (`SCOPE`, 28-sep 22:10) y la huella
del trabajo (`HUELLA`, 30-sep 01:28). Arreglado y en main: **merge `5a62c8b`** —
el asiento se busca **por su motivo** (`MOTIVO_WORKTREE`, compartido por quien
escribe y quien lee), no por su posicion. Verificado con el codigo real sobre el
libro real: la `7998aa13` sale **FIRMABLE** y de las doce propuestas de FORTRESS
**ninguna otra**, asi que el arreglo no revive nada. Detalle en DEUDAS §13.

**EL PATRON, y conviene nombrarlo sin rebaja: esta vez el autor fui yo.** Los dos
asientos que rompieron la firma los escribi en dos arcos correctos, utiles y
probados, y en ninguno de los dos recorri a sus LECTORES. El gate ciego lo
mantuvo invisible tres dias; la **primera** propuesta que llego a la firma lo
destapo. La leccion que queda escrita en el dominio
(`src/domain/repair/motivo-del-worktree.ts`): **un asiento se busca por lo que
ES, nunca por su POSICION**, y **anadir un dato al libro obliga a mirar quien lo
lee**. Con su corolario de pruebas: el fixture tenia **un solo** `GENERATE
DECISION` y **sin `reason`**, asi que ningun test podia notarlo —**un doble que
no se parece al original no prueba lo que dice probar**—.

**LA QUINTA CAPA, y el precio que cobro.** El operador hizo el rebuild, pulso
Firmar, y la app contesto `merge-failed-target-branch-detached` con `main` en su
rama. `git-del-merge.ts` componia su entorno en un **`const` de modulo**, y los
imports se evaluan ANTES del `augmentPath()` del arranque: una app abierta con
doble clic congelaba ahi su PATH minimo, sin `node`, y la caja del merge no podia
levantarse. **Sus tres hermanos ya lo hacian bien** y lo decian en su docblock
—«se compone al lanzar y no al cargar el modulo»—; `git-del-merge` era el unico
que lo congelaba. Nadie lo vio antes porque **la firma del operador fue la
PRIMERA vez que la caja se levanto desde el AppImage**: las corridas del Motor se
habian hecho desde un arnes con el PATH de una shell. Arreglado y verificado con
el PATH real del proceso de la app (DEUDAS §14).

**EL FIX RESCATADO A MANO.** El merge fallido **caduco** la propuesta, que es
terminal y por diseno. El estado quedo coherente —nada se marco MERGEADO sin
merge— pero el trabajo quedaba huerfano: el fix, su gate verde de 242 s, el
APROBADO de OMEGA y $0,97. El commit `8913dab` seguia intacto en su rama, asi que
**entro a main por un merge a mano** (`e659c14`), que es exactamente lo que el
Motor iba a hacer: **el camino completo del Motor funciono, de la seleccion al
veredicto; lo unico que fallo fue integrar.** Y el merge a mano **NO mitiga el
hallazgo**: `marcarElHallazgoIntegrado` cuelga de `to === 'MERGEADO'`, que no se
alcanzo, asi que `fa86739d` sigue **`open`** —sin nota, sin fecha— y **la mitad
pendiente de DEUDAS §12.1 sigue a la vista**, que es lo que convenia: firmar la
habria tapado.

### EL LAZO, construido (ADR-110, 2026-10-02)

El Motor ya no deja mitades. Cuando OMEGA **aprueba** un fix diciendo que
resuelve el hallazgo **PARCIALMENTE**, el generador da **otra vuelta sobre su
propia sesion** (`--resume --fork-session`) con la objecion del revisor en el
prompt, y solo cuando no quedan vueltas se integra o se espera la firma.

**Tres piezas, y la primera era una deuda que la arista convertia en defecto:**

1. **La arista** `OMEGA -> GENERADO`, la unica que vuelve atras, y
   **`collectGateOutcome` arreglado**: leia `find(TRANSITION)` —el PRIMER
   cierre— y recogia TODOS los comandos de fase GATE, asi que con dos vueltas el
   expediente de la firma habria mezclado las dos. Ahora el cierre es el ULTIMO
   y sus comandos los de SU vuelta (clase DEUDAS §13).
2. **El disparo y la vuelta**: el eje `resuelve_el_hallazgo` DENTRO de un
   aprobado (por D19 un PARCIAL no veta), la sesion recapturada en cada vuelta
   —`--fork-session` abre una nueva—, la objecion saneada como encargo que dice
   «completa, no deshagas», y la guarda de presupuesto reusada sin exigir
   `ANALIZADO`.
3. **Las dos paradas**: la **huella** del diff (converger es un desenlace, no un
   fallo) y el **tope de 2** corridas del generador, con un tope de **$5** por
   propuesta como ultima red —en DOLARES, porque `trabajoReal` excluye la
   relectura y `--resume` la multiplica: +47 % medido con el mismo trabajo—.

**Medido en vivo:** sobre el libro real del unico PARCIAL que existe, el lazo
**habria disparado** ($0,9674 de $5, 1 vuelta de 2); y la vuelta reanudada corrio
de verdad —8 turnos, $0,2968, sesion nueva, `checkScope` limpio, arbol vivo
intacto— y **se nego a cambiar nada diciendo por que**: la mitad que falta en ese
hallazgo no es una edicion dentro de la correa, es una decision. Eso es el §7 del
ADR apareciendo en el primer caso real, y el lazo lo archiva sin inventar nada.

**Lo que el lazo NO hace:** ensanchar la correa. Los PARCIAL que piden terreno
nuevo siguen esperando la correa de dependencias.

**EN MAIN** (merge `25241f3`, gate 11/11 sobre main, 12 mutantes). **Y lo que
queda por ver, dicho sin rebaja: PARCIAL -> COMPLETO en vivo.** La mecanica esta
probada entera —dispara, da la vuelta, respeta correa y sandbox, para por las dos
condiciones y no fuerza un fix malo—, pero que una vuelta CIERRE la mitad abierta
necesita un hallazgo cuya mitad sea una edicion dentro de la correa, y el unico
PARCIAL que existe hoy no lo era. **El primer drenaje real con uno de ese tipo lo
demostrara** (DEUDAS §15.2); no se fuerza con una corrida que depende del azar.

**Y no esta en el binario:** el instalado era del rebuild del 1-oct. El operador
reconstruyo esa misma noche (`838edbfb`, 2-oct 01:45) y el lazo entro.

### EL PRIMER DRENAJE REAL CON EL LAZO (2026-10-02)

Cinco horas de drenaje autonomo sobre FORTRESS, con el lazo en produccion por
primera vez. **36 propuestas trabajadas, ~$32 de agentes, 21 fixes integrados con
la firma del operador.**

| | |
|---|---|
| **el lazo disparo DOS veces** | `8c7ac26d` (la vuelta produjo fix y **su propio gate la corto**: 75 lineas en un test) y `735152ef` (ciclo completo: vuelta 2, gate verde, **segundo juicio independiente**, `PARCIAL` otra vez, **parada por tope de vueltas**, y a firma con el fix mejorado) |
| **y NO disparo** en los 18 `SI` | `gen=1` en todos: ni una vuelta de mas, ni un dolar de mas. El camino rapido del §4 probado en produccion |
| **las tres salidas de OMEGA**, cada una por su camino | `SI` → a firma · `PARCIAL` → el lazo · `NO` → veto y `retryRepair` con analisis fresco, que acerto al segundo intento donde el primero fue vetado |
| **el Motor auditó el codigo de ayer** | encontro que `git-del-merge.ts` usaba una lista NEGRA donde tocaba una lista BLANCA —`GIT_DIR` podia colarse a un `git merge` sobre el arbol vivo— y lo arreglo mejor de lo que estaba, nombrando su propio residuo |
| **`collectGateOutcome` se gano el sueldo** | la `735152ef` es el primer expediente con DOS gates; sin el arreglo del 1-oct, la pagina de firma habria mezclado los comandos de las dos vueltas |

**Y una rotura, cazada y cerrada el mismo dia:** dos fixes buenos de la misma
tanda —el guardian de los spawns y el entorno del merge— **verdes por separado,
rojos juntos sin compartir un solo fichero**, dejaron `main` en rojo y caducaron
una propuesta inocente. El arreglo fue del **guardian**, que ahora juzga el
entorno **por su FORMA y no por el nombre** de quien lo construye (DEUDAS §16).
Nada se publico en rojo: `origin` espero en verde hasta que el arbol lo estuvo.

**LAS DEUDAS QUE EL DIA DEJA**, todas con su evidencia y su numero:

1. **El recibo del lazo**: cuando el lazo **no** da la vuelta no deja
   rastro —`cerrarLaCadena` ignora el campo `parada`—, asi que una parada
   legitima y un fallo se ven igual: nada. **CERRADA el 2026-10-03** (merge
   `2c56621`, DEUDAS §15.5; el «(§15.2)» con que nacio apuntaba mal): las cinco
   paradas declaran su motivo en el libro; `completo` y `paso-fallido` callan a
   proposito. Telemetria, no ADR: el lazo para igual. No esta en el binario
   recien instalado y **no urge**: solo se ve en un drenaje con el lazo parando
   sin disparar; entra en el proximo rebuild.
2. **La mitad abierta del PARCIAL** (§15.4): la lista `files` del empaquetado
   sigue siendo negra, `ADR-058`/`RELEASE.md` sin actualizar, y **el asar sin
   verificar** — porque el gate corre `electron-vite build`, no `build:linux`.
3. **La correa de dependencias**: ~**$4,20** quemados en hallazgos cuyo arreglo
   vive en `package-lock.json` y que el Motor **no puede cerrar hoy** (el
   Electron, los CVEs del tooling), con dos intentos por causa antes de la pausa.
   **CERRADA para los CVEs de JS el 2026-10-03: ADR-111** (ver su entrada abajo);
   el Electron sigue fuera a propósito (pieza B / §3.5).
4. **La pagina de firma deberia GUIAR el orden** (§16.4), con sus cuatro
   preguntas a medir. Es comodidad, no seguridad: `arbol-integrado-rojo` ya
   protege. **CERRADA el 2026-10-03** (merge `399fc7a`, DEUDAS §16.4): guia
   estatica + «medir la tanda» con biseccion que nombra culpables + reset del
   worktree solo tras rojo (el verde conserva la sonda: lo medido ES lo que
   entra). Caza lo de §16.1 sin que nada caduque. No ADR: las politicas
   firmadas quedaron intactas. Falta en el binario; va en el proximo rebuild.

**Tres propuestas se regeneran solas** en el proximo drenaje, sin gesto de nadie:
`d5bbef5b` (caduco inocente por el rojo), `b347d1e4` y `03ed20b0` (retiradas por
chocar con su par). Sus hallazgos volvieron a la baraja al dejar de estar vivas, y
naceran ancladas al main nuevo, que ya lleva el fix de su hermana.

**LO QUE SIGUE, en orden y sin saltarse un paso:** el **rebuild+install en frio**
(la firma es un boton de la app, no un comando: `repair:sign` es IPC, y el
arreglo del merge todavia no esta en el binario) → **la proxima firma desde la
app**, que es lo que cierra el camino punta a punta → y entonces si, **el LAZO**.

**AVISO DE TECHO:** `innegociables-defensa.ts` queda en **75/75 líneas** con las
dos familias nuevas (perímetro + selección). La siguiente familia **parte el
fichero por familia**, no sube el límite. Es la regla del `CLAUDE.md`, y este
fichero ya es el caso de prueba.

**LO QUE SIGUE EN ESTE ARCO:** dejar correr al motor con los ojos puestos →
decidir el techo con el dato → dimensiones 3 y 4 (profundidad, y la cadena
OMEGA → firma).

**EL PRÓXIMO PASO RECOMENDADO.** Con la trifecta del aislamiento cerrada y el P1
del analista dentro, **la auditoría no deja ningún P0 de seguridad abierto**. Las
dos vías abiertas son el **arco del Motor** —que ahora espera dato, no trabajo— y
el **barrido de los tramos 2 a 7**, con `scripts/` primero: 106 ficheros sin un
solo test, corriendo sobre la base viva. Pendientes menores con dueño claro: las 5
filas viejas en `otro` (un lote con el kit, si Jojo quiere rescatar esa señal) y el
rebuild, que acumula **CUATRO** arcos de código desde el binario del 30-sep
(ADR-108, la vía 3, ADR-109 y el expediente de la firma) y **bloquea la firma**.

**AVISO OPERATIVO:** no drenar al abrir la app hasta decidir el bucle de gasto, o
recomprar antes los cinco pausados. Con ADR-107 el **LOOP ya no existe**, así que
el único gasto que puede arrancar solo es el **Drenaje**, y sus dos topes salen en
**0** mientras nadie los fije: corta en la primera vuelta en vez de gastar a
ciegas.

### LA CORREA DE DEPENDENCIAS (pieza A): HECHO Y VERIFICADO (ADR-111, 2026-10-03)

**FORTRESS resuelve los CVEs de JS como `claude -p`.** Tres piezas, firmadas y
mergeadas (`d206516`): el **grupo de alcance** (`when: package.json → allow:
package-lock.json`, declarado en el `.fortress/config` propio), **npm
pre-aprobado en el generador SOLO** con `--package-lock-only --ignore-scripts`
(comodín en medio, jamás `:*` — trece mediciones contra la capa de permisos,
ADR-111 §3), y **el prompt obliga la forma** cuando el ancla es `package.json`
y el grupo abre el lock. Seis mutantes muertos; gate completo en verde sobre
main.

**Verificado en vivo** (worktree nacido de la rama, args reales): el generador
cerró el CVE de vitest **a la primera** con la forma segura ($0,83, 7 turnos) —
lock regenerado (173 líneas), `checkScope ok`, vitest y `@vitest/mocker` fuera
del audit—, y los negativos con los MISMOS args: `npm install` a secas y
`npm run build`, **DENIED**. **El Electron (el ABI) sigue fuera**: pieza B /
§3.5, decisión del operador sobre las cabeceras; el camino queda muerto por dos
capas (la regla niega el install que recompila, y la red niega `nodejs.org`).

**Dos datos que la medición dejó, para no redescubrirlos:** (1) `touch`/`echo`
encadenados tras el npm seguro CORREN — pero corren **con o sin la regla
nueva**: es auto-aprobación preexistente del CLI (medida el 2026-10-02), no
capacidad que ADR-111 abra, y la contienen la caja y la correa post-generación.
(2) Lección de método: un mutante se revierte con **copia** (`cp` backup),
nunca con `git checkout` — el checkout se llevó una edición sin commitear y
hubo que rehacerla.

**Lo que queda por ver en vivo:** OMEGA y el gate del Motor **juzgando un lock
real** — llega solo, en el primer drenaje real tras este merge.

**NOTA PARA EL REBUILD:** el binario instalado NO lleva ni ADR-111, ni el lazo
(ADR-110), ni los 21 fixes del drenaje, ni el arreglo del guardián. **El
próximo rebuild+install en frío los lleva todos**; hasta entonces la app corre
sin la correa de dependencias.

### LA PIEZA B DEL ELECTRON Y LA TANDA DEL BACKLOG (2026-10-03)

**La pieza B, HECHA por enmienda firmada** (ADR-108 §6, DEUDAS §11.9):
procedimiento, no código. Poblar los padres de la caché del host con la
versión destino (cabeceras + zip + SHASUMS, receta en el ADR) hace que los
montajes existentes sirvan el major; ADR-111 ya generaba el bump (lock-only) y
el muro era solo del gate. Descartados con dato el devdir escribible (las
sondas de calidad corren clase B sobre CLIENTES) y la red ancha (github.com).
**Balance: FORTRESS tan capaz como `claude -p` en cualquier severidad** — los
CVEs de JS por la correa, el ABI por la correa + el gesto de dos comandos.

**La tanda del backlog, COMPLETA y mergeada** (`48ec2da`): 20 observaciones —
4 arreglos (la correa se presenta como PERMITIDOS; el alcance dice carpeta
ENTERA; el símbolo es el bloque REAL, fuera sub-bloques; el aviso del `(?i)`
que falla en silencio, medido contra el servidor), 3 ya curadas con fecha
probada (e90ed58, §6.12), 13 descartes de doctrina. `atendidos.json` escrito;
el import es el botón del panel (idempotente, el fichero no se consume).

**NOTA PARA EL REBUILD:** el binario instalado (`73b30af0`) acumula ya SIN
llevar: el recibo del lazo, la guía de firma y esta tanda del backlog. El
próximo rebuild+install en frío los lleva todos.

### ADR-112: EL TRANSPORTE POR STDIN, HECHO Y VERIFICADO (2026-10-03)

**El E2BIG está muerto.** El prompt de los agentes viaja por stdin en los
cuatro constructores (generador —edición y lectura—, el CLI del
Terminal/escáner, index-graph, verify-graph) y sus seis spawns; cruza el
bwrap real (200 KB medidos dentro de la caja) y deja los args en ~858 bytes —
caben en Windows (32.767) con margen de 37×; **Windows queda medido por el
límite, no probado en máquina real** (ADR-112 §4). Umbral per-arg real de
esta máquina: 128 KB exactos. 5 mutantes muertos, incluido el spawner que no
escribe (cazado por un `claude` falso que ES `cat`).

**§17.3 RESPONDIDO en vivo** sobre `7a3711a7` (el CVE de JS, gate verde): el
expediente de 765.491 bytes viajó entero — y el revisor con el lock DENTRO
costó **$8,90 y salió sin veredicto**; con el acotado aplicado en el arnés
(lock → nota legible), **26 KB, 4 turnos, $1,04, APROBADO** (resuelve SI,
diff BUENO, riesgo MENOR) citando ADR-111 y reconociendo el ruido del lock
como «el mismo perfil de ~173 líneas medido». OMEGA juzga el lock con el
diff. **La lección: §18 (el acotado, (a)) no es estética — es dinero, casi
tan urgente como el transporte.**

**NOTA REBUILD (se acumula):** ADR-112 NO está en `73b30af0`. El binario
actual daría E2BIG en el juicio del CVE: **el juicio oficial de `7a3711a7`
necesita merge + rebuild en frío.**

### §18 CERRADA: EL ACOTADO DEL EXPEDIENTE (2026-10-03, merge `e1da645`)

TOPE 32 KiB por fichero del expediente de OMEGA, los DOS lados (pre y post),
con la nota legible del arnés convertida en contrato. **El ciclo de
dependencias queda completo end-to-end: la correa GENERA (ADR-111) → stdin
TRANSPORTA (ADR-112) → el acotado deja JUZGAR BARATO.** El dato que lo
ordenó: $8,90 sin veredicto → $1,04 APROBADO.

**EL REBUILD, ya sin excusa:** `73b30af0` NO lleva nada de hoy — el recibo
del lazo, la guía de firma, el backlog, ADR-112 ni el acotado. El próximo
rebuild+install en frío los lleva TODOS, y entonces `7a3711a7` (el CVE vivo
en GATE) recibe su juicio oficial desde la app, sin E2BIG y al precio del
diff.

## Cómo se firma cada dirección

Ninguna de estas áreas se ejecuta por figurar aquí. Cada una se firma
explícitamente antes de arrancar, y los detalles de la decisión —contexto,
alternativas consideradas y consecuencias— se registran como una decisión
arquitectónica en [DECISIONS/](DECISIONS/README.md) en el momento en que se
toma. Este roadmap señala el rumbo; las decisiones lo fijan.

## Referencias

- [HISTORY](HISTORY.md) — de dónde viene el proyecto.
- [CHANGELOG](CHANGELOG.md) — qué ha cambiado hasta ahora.
- [DECISIONS/](DECISIONS/README.md) — las decisiones que sostienen cada
  dirección.
- [INVESTIGACION-FRONTERA-2026](INVESTIGACION-FRONTERA-2026.md) — la referencia
  externa del último tramo, verificada fuente por fuente.
- [DEUDAS](DEUDAS.md) — las deudas medidas que ese tramo ordena.
