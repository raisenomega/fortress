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

### 3. El contrato del hallazgo — **EN MARCHA** (3 sub-piezas, el corte 3 y el guard del arreglo hechos, 2026-09-23)

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

**Queda del #3**:

- Cada una con su medición: el defecto declarado a propósito, las cadenas de
  explotación, la **severidad por familia** (ADR-100 §4: los ejes son de
  seguridad y accesibilidad o privacidad quedan `sinEjes`, con la palabra del
  modelo), y el **patrón A** de la línea que ya no es (reanclar por símbolo o
  «última definición gana», ADR-067 y ADR-084).
- Infraestructura anotada hasta que aparezca quien la lea: la columna «dónde se
  arregla» y la vista «declara / arregla» (ADR-102 §1.5).

*Lo que sigue era el diagnóstico, y se conserva:*

Los 27 tipos son todos de seguridad: accesibilidad y privacidad caen en `otro` y
pierden identidad entre escaneos. No se puede expresar una cadena de explotación,
ni un defecto declarado a propósito, ni la diferencia entre dónde se declara un
defecto y dónde se arregla. Y agrupar «hermanos» por clase empareja defectos que
no son el mismo.

### 4. El grafo, más allá de JavaScript

La búsqueda devuelve cero en repositorios pequeños, y el índice no cubre `.py`,
configuración, SQL ni carpetas ignoradas. *Grafo primero* falla justo donde viven
las barreras de un proyecto.

### 5. Toda la aplicación dentro del tribunal y del sistema nervioso

Medido por sitios de llamada: Escaneo y Terminal autónomo corren la disciplina
completa. **LOOP, Construir y Cognition no escriben una sola observación**;
Construir no tiene crítico ni juez; cuatro flujos siguen en el modo que bloquea el
grafo; y un turno suelto en autónomo edita sin pasar por la guarda de barrera. Se
conecta órgano por órgano.

### 6. Mergear lo ya hecho

Parte de lo que falta está escrito y sin integrar: trece hallazgos del
auto-escaneo se cierran solos al mergear la rama de limpieza. Es una decisión del
operador, no un trabajo.

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
