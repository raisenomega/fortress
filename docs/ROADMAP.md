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
barreras): LOOP observa sus paradas y sus standbys **del dato duro**, no del
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
- **4. La nota de parada del LOOP viaja en crudo.** Mete `error.message` sin
  aplanar ni acotar: nota no determinista, un avistamiento por reintento y sin
  tope de 500.

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
