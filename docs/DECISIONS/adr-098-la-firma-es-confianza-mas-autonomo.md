# ADR-098 — La firma es confianza + autónomo: sobre proyecto propio FORTRESS arregla lo reversible y sigue; el clic de producción es herramienta del dueño, no límite del sistema

- **Estado**: Aceptada (firmada por el operador el 2026-09-21)
- **Fecha**: 2026-09-21
- **Alcance**: Terminal autónomo (el lote) sobre un proyecto firmado · define,
  sin construirlo, el agente de datos y despliegue. **No toca** el Motor ni LOOP
- **Relación**: **ENMIENDA A LA LEY SIN-FRENOS** (ADR-090 §0, ADR-093 §0) ·
  extiende la firma de **ADR-089** de «garantía» a «autorización» · afina el
  fail-closed de `guardBarrera` (registrado en `docs/DEUDAS.md`, sin ADR propio)
  · depende de **ADR-092, el sandbox**, para todo lo que pida Bash libre
  (ADR-093 Pieza 3) · se apoya en **ADR-079** para definir «reversible»
- **Nace de**: el ensayo en vivo del 21-sep, donde el fail-closed **funcionó** y
  el operador, al verlo funcionar, preguntó por qué FORTRESS se detenía ante una
  barrera que es suya.

---

## §0 — La ley aplicable, y qué le enmienda este ADR

La ley sigue entera (ADR-093 §0, copiada de ADR-090 §0 y ADR-091 §0):

> *«Todo proyecto que FORTRESS trabaja es de Jojo, de producción, de confianza.
> Un proyecto de confianza **NO lleva topes, frenos ni límites** […] El Terminal
> tiene la **MISMA capacidad** que Jojo con `claude -p`: corre lo que necesite.»*

**Lo que este ADR le añade** es el nombre de lo que la sostiene. Hasta hoy la
firma humana era la **garantía** que quedaba debajo cuando se retiraba un freno
(ADR-089). Aquí pasa a ser también la **autorización**: los dos gestos del
operador —marcar el proyecto de confianza y elegir autónomo— **son** su
aprobación, dada una vez y por adelantado, para que FORTRESS actúe sobre ese
proyecto como actuaría él.

Un freno disfrazado es *«cualquier mecanismo que reduce la capacidad de resolver
y se justifica por una razón que no es la corrección»* (ADR-090 §0). Este ADR
caza el cuarto: **por dueño** — detenerse ante algo del propio operador y
llamarlo «límite del sistema».

---

## 1. Contexto

### 1.1 Lo que Anthropic dice, verificado en la fuente

El argumento de partida fue que Anthropic exige que *«el humano decide qué código
se envía»*. **Esa frase literal no existe** en la documentación oficial de Claude
Code (buscada el 2026-09-21). Lo que sí dice, textual:

> *«Claude Code only has the permissions you grant it. You're responsible for
> reviewing proposed code and commands for safety before approval.»*
> — `code.claude.com/docs/en/security`, «User responsibility»

Y dice otra cosa, que es la que sostiene la decisión del operador:

> *«…it asks you first, and you choose whether to approve the action once **or
> allow it from then on**.»* — misma página, «Permission-based architecture»

**Aprobar por adelantado es un patrón documentado, no una lectura forzada.** El
modo `acceptEdits` existe para eso —*«when you want to review changes in your
editor or via `git diff` after the fact rather than approving each edit
inline»*— y es el que FORTRESS ya usa en autónomo.

Lo que la misma documentación **no** deja delegar, y este ADR no pretende que
delegue: la **responsabilidad**. Firmar por adelantado no la traslada a
FORTRESS; la deja donde estaba, en quien firma.

### 1.2 La firma ya estaba definida en el código

No es un concepto nuevo. `modo-efectivo.ts:32-35`, desde ADR-089:

> *«La firma humana —el operador eligio autonomo y marco el proyecto de
> confianza—, el criterio del propio modelo, el gate, y git, que revierte.»*

Y ya es estructural: `effectiveMode` (`modo-efectivo.ts:57-62`) degrada a
supervisado si falta la confianza, y `terminalPuedeResolver`
(`terminal-puede-resolver.ts:23-25`) ni ofrece el lote sin ella.

### 1.3 El ensayo del 21-sep, con lo que la base dice

Proyecto `ensayo-fail-closed` (`93f7675b`), un hook `PreToolUse` que llama a
`python` en una máquina donde solo existe `python3`. Lote de 3 en autónomo:

- **La guarda negó la ejecución.** `agent_runs` tiene el plan ($0,65 · 142 s) y
  OMEGA ($0,31 · 22 s) y **ningún turno de ejecución**.
- **La observación se asentó** (`kind=bug`, `area=barrera-del-proyecto`) 245 ms
  antes del mensaje del plan, y está en el export de auto-mejora.
- **El dato que decide este ADR:** ese proyecto estaba `trusted = 1` y el modo
  guardado era `autonomo`. **El fail-closed se disparó bajo la firma completa.**

### 1.4 La base de modelos, dicha con su letra pequeña

Cifras de SWE-bench Pro aportadas para este ADR: Fable 5.1 81,2 % · Mythos 5
80,3 % · Opus 5 79,2 % · Qwen3.8 Max 67,7 % · GLM-5.2 62,1 % · Kimi K2.6 58,6 %.

Verificadas el 2026-09-21: las seis aparecen en fuentes, **y las seis son
auto-reportadas por su fabricante**, con arneses distintos. Ninguna está en el
leaderboard oficial de Scale, cuyo máximo es 61,5 %. Fable 5 figura con **80,0 %**
en la mayoría de fuentes; el 80,3 % es de Mythos 5. Las cuatro de Anthropic se
leyeron en agregadores que citan sus *system cards*, no en las *cards*.

**No son comparables entre sí, y el ADR no se apoya en que lo sean.** Se apoya en
lo contrario: si la ventaja fuera el modelo, la tendría cualquiera que lo pague.

---

## 2. DECISIÓN 1 — La firma por adelantado

**Confianza + autónomo = la aprobación humana, dada una vez.** Bajo esa firma,
FORTRESS hace sobre el proyecto lo que haría el operador: edita, ejecuta, cierra,
y **arregla lo que encuentre roto y sea reversible** para poder seguir. No pide
permiso por gesto.

La firma, en código, son cuatro hechos, y los cuatro ya existen:

| Hecho | Dónde vive |
|---|---|
| El proyecto es de confianza | `project.trusted` (`project.ts:33-37`), leído por `ejecutaConConfianza` (`confianza.ts:19-21`) |
| El operador eligió autónomo | la fila de `settings`, leída por `esAutonomoDeVerdad` (`modo-guardado.ts:33-35`) — **nunca** `input.mode` |
| No es el repo de FORTRESS | `selfRepo` (`modo-efectivo.ts:60`) |
| Hay red de reversión | `redGit` (ADR-079) |

**«Propio» NO es `selfRepo`.** En este documento *proyecto propio* es un proyecto
del operador. En el código *repo propio* es el de FORTRESS, y **sigue degradando a
supervisado** por la razón escrita en `modo-efectivo.ts:39-44`: un agente
autónomo sobre sus propios guardas puede desmontar su jaula sin mala intención.
Este ADR no lo toca.

---

## 3. DECISIÓN 2 — El fail-closed se afina: dos ramas

| Rama | Cuándo | Qué hace FORTRESS ante una barrera rota |
|---|---|---|
| **Sin firma** | el proyecto no es de confianza, o el modo guardado no es autónomo | **Fail-closed.** No repara, no ejecuta sin la protección, y asienta la observación |
| **Con firma** | confianza + autónomo de verdad + no `selfRepo` + red git | **Arregla lo reversible y sigue.** Asienta la observación igual, y deja recibo del arreglo |

**La razón:** sobre un proyecto firmado no hay barrera ajena que respetar. Es la
barrera del operador, está rota, y él la arreglaría con una palabra —`python` →
`python3`— antes de seguir. Detenerse ahí es hacerle volver para teclearla.

### 3.1 Lo que NO se revive: el campo de dueño

El encargo de este ADR habló de código *propio* y *ajeno*. **Esa distinción no
existe en el código y no se crea aquí.** ADR-093 ENMIENDA 2 la descartó *«con su
razón escrita, para que nadie lo reviva»*: `trusted` significa *«el operador dejó
que este repo ejecute sus scripts»*, no *«este código es de Jojo»*; `Project` no
tiene campo de dueño; y clasificar proyectos es *«una defensa que depende de que
alguien se acuerde de marcar»*.

Por eso las ramas se separan **por la firma y por nada más**. «Ajeno», en este
ADR, se lee *«sin firma de confianza»*.

### 3.2 HILO NOMBRADO — hoy el fail-closed solo puede dispararse CON firma

Medido, y es lo primero que el operador debe ver antes de firmar:

- el lote **solo se ofrece** si el proyecto es de confianza
  (`terminal-puede-resolver.ts:24`);
- `guardBarrera` **solo niega** si es un lote y el modo guardado es autónomo
  (`barrera-guard.ts:54`).

Las dos juntas: **todo bloqueo de hoy ocurre bajo la firma completa.** Con este
ADR esos casos pasan a *arregla-y-sigue*, y **la rama «sin firma» se queda sin
ningún camino que la dispare**: sobre un proyecto sin confianza el agente ya no
puede escribir (`effectiveMode` degrada) y el lote no existe.

Eso **no la hace inútil** —es la red de un camino que alguien abra mañana, y el
`LO QUE NO CUBRE` de `barrera-guard.ts:40` ya nombra uno, el turno suelto—. Pero
quien firme debe saber que **firmar esto retira el fail-closed del único sitio
donde hoy actúa**, y que lo que lo sustituye es el arreglo, no otra guarda.

### 3.3 HILO NOMBRADO — un cliente marcado de confianza

Consecuencia directa de §3.1: un proyecto de cliente marcado `trusted` —que es
*«exactamente para lo que la marca existe»* (ADR-093)— entra en la rama **con
firma**, y FORTRESS le arreglará el `.claude/settings.json`. Eso contradice, a
sabiendas, lo que hoy dice `barreras-del-proyecto.ts:16-18`:

> *«SOLO LEE. No ejecuta el hook, no lo repara y no toca el proyecto: FORTRESS
> audita, y arreglarle el settings a un cliente sin pedirselo seria editar codigo
> ajeno por iniciativa propia.»*

**La respuesta de este ADR:** marcar de confianza **es** pedírselo. Quien marca
firma que FORTRESS actúe ahí como él. Ese docblock se reescribe en el arco de
construcción; mientras no se construya, sigue siendo verdad.

### 3.4 Qué es «reversible», y quién hace el arreglo

**Reversible** = deshacerlo devuelve el proyecto byte a byte a como estaba, y
FORTRESS puede hacerlo sin el operador. Dos hechos medidos condicionan el cómo:

1. **El agente no puede hacer este arreglo: documentado, y medido en vivo.**
   `.claude` es *directorio protegido* del CLI: en `acceptEdits` esas escrituras
   se **preguntan**, las reglas `allow` **no** las pre-aprueban, y un `-p` sin
   quien responda no las ejecuta (`code.claude.com/docs/en/permission-modes`,
   «Protected paths»). **La corrida lo confirmó** (21-sep, CLI 2.1.278, `-p` +
   `acceptEdits`): un `Edit` sobre `.claude/settings.json` volvió *«Claude
   requested permissions to write to … but you haven't granted it yet»*; un
   `Write` de un fichero nuevo dentro de `.claude/`, *«…which is a sensitive
   file»*; la edición de control fuera de `.claude/` pasó. Y en el caso real
   —pedirle al agente que cambie `python` por `python3` en el hook— el `Edit` se
   negó y el comando quedó como estaba. **El arreglo lo hace FORTRESS**, en el
   proceso principal y de forma determinista: cambia el intérprete por la
   alternativa que `barrera-rota.ts` ya comprobó que existe. No es una edición
   del modelo.
2. **El checkpoint no siempre lo cubre, y está medido.** ADR-079 revierte lo que
   `git add -A` ve. `raisen-nucleo` ignora `.claude/` (`.gitignore:40`; el fichero
   no está rastreado): ahí la red **no** deshace el arreglo. `ensayo-fail-closed`
   sí lo rastrea. El arreglo guarda por tanto **sus propios bytes de antes**,
   siempre, sin mirar qué proyecto es. Sin eso no es reversible, y entonces no
   entra en esta decisión.

**Lo que NO está decidido:** la barrera rota **sin arreglo verificado**
(`alternativa === null`: no hay `python3` que ofrecer). No hay nada reversible
que hacer. Hasta que el operador decida, vale lo construido y probado:
**fail-closed.** Las opciones van en las casillas de firma; la que pasa por el
tribunal antes de rendirse se describe entera en §3.7. **Decidido al firmar
(§12): la cadena de §3.7** — y mientras no esté construida entera, fail-closed.

### 3.5 «Que arranque no es que bloquee»

Arreglar el intérprete hace que el hook **arranque**. No prueba que **proteja**:
un guion de Python 2 arranca con `python3` y revienta, y FORTRESS solo comprobó
que el intérprete existe.

**La sospecha concreta se midió, y era falsa alarma.** El hook real de
raisen-nucleo imprime `{"decision":"block",…}` y sale con **código 0**, un
esquema que la documentación actual ya no muestra. Ensayo del 21-sep, en
directorio desechable, con el hook copiado byte a byte y el CLI 2.1.278 en
`-p` + `acceptEdits`: **el `Edit` sobre `supabase/migrations/` se negó**
(`PreToolUse:Edit hook error: Protegido: …`, con su fila en
`permission_denials`), la edición de control sobre un fichero libre pasó, y un
brazo con el esquema nuevo dio el mismo resultado. **Ese esquema sigue
protegiendo**, contra las tres herramientas que su `matcher` nombra:
`Write|Edit|MultiEdit`.

**Y Bash lo esquiva: medido.** Mismo montaje, mismo hook byte a byte, `Bash`
habilitado: `sed -i` cambió la migración protegida (`-- A` → `-- B`) y una
redirección creó `supabase/migrations/0002_nueva.sql`. **Cero denegaciones.** Un
registro neutro con `matcher: "*"` vio pasar las dos llamadas: `PreToolUse`
**sí** se dispara para `Bash`; es el hook del proyecto el que no lo nombra. Y el
Terminal autónomo corre justo así: `acceptEdits` con `Bash` ofrecido
(`build-allowed-tools.ts:64-66` solo lo quita en `lectura`). **Una barrera sana
de este tipo protege de `Edit`, no de `Bash`** — con firma o sin ella, y eso no lo
arregla cambiar un intérprete.

**Hasta dónde llega ese hueco: medido también.** Mismo modo, con un binario
**falso** que solo anota que lo llamaron: `touch control.txt` pasó;
`./bin/supabase db push` y `supabase-ensayo db push` volvieron *«This command
requires approval»*, con su fila en `permission_denials`, y el binario falso **no
llegó a ejecutarse**. En `-p` + `acceptEdits` el agente **escribe ficheros** por
`Bash` y **no lanza un despliegue**. El hueco es de ficheros —en raisen-nucleo,
361 migraciones rastreadas por git: visible y reversible—, no un camino a la
base. Queda el canal de siempre, el que `trusted` gobierna: un
`Bash(npm run <script>)` pre-aprobado ejecuta lo que el `package.json` diga
(`safe-commands.ts:44-48`). No se midió aquí.

El recibo del arreglo dice por tanto *«la barrera ya arranca»*, **nunca** *«la
barrera ya protege»*. Y una barrera que sí protege negará, bien negadas, las
ediciones de FORTRESS sobre lo que cubre: eso es el dueño hablando, no un fallo.

### 3.6 Lo que no cambia

- **La observación se asienta siempre** (`barrera-guard.ts:26`). Arreglar no
  borra lo aprendido: el backlog se entera igual.
- **El modo sale de la base**, nunca del mensaje (`barrera-guard.ts:35`). La
  firma se lee donde no se puede falsificar.
- **En supervisado** hay un humano delante: FORTRESS avisa, propone el arreglo y
  él decide. Queda nombrado que `turno-del-lote.ts:40` manda `mode: 'autonomo'`
  también ahí, así que un lote supervisado **edita** con media firma. No se
  resuelve aquí: es del arco de construcción.

### 3.7 La barrera que FORTRESS no sabe arreglar de entrada: la cadena, y su último eslabón

*Opción de la casilla 2, redactada a partir del diseño del operador. A quien
redacta le llegó transmitida por quien asesora, no de primera mano: por eso el
operador la lee **aquí**, con estas palabras, antes de marcarla.*

Cuando la barrera está rota y **no hay arreglo verificado** que aplicar (§3.4),
FORTRESS ni se detiene ni sigue sin más. **Agota el tribunal:**

1. Consulta la **documentación oficial** de la tecnología de esa barrera.
2. **Búsqueda web**: foros, sitios, la fuente.
3. **Debate**: el productor propone un arreglo y el crítico busca dónde falla
   (ADR-096).
4. **Si converge → arregla y sigue.** El arreglo sigue siendo lo primario; ahora
   lleva investigación detrás.
5. Si no converge, **juzga OMEGA**. Y solo si OMEGA tampoco resuelve: **sin la
   barrera, con recibo.** FORTRESS sigue trabajando y deja constancia de que la
   barrera estaba rota y de que ni la investigación ni el tribunal la arreglaron.

Es la doctrina de la Decisión 4 aplicada a la barrera: no rendirse a lo que se
sabe de memoria; ir a la fuente.

**NADA de esto está construido.** Hoy existe el fail-closed y nada más; marcar
esta opción fija la **dirección**. Y lleva una condición, que es la que impide
que se degrade en lo que el operador dijo que no quería —*«sigue sin más»*—:
**el eslabón 5 no se construye ni se enciende antes que los cuatro anteriores.**
Mientras la cadena no exista entera, ante una barrera sin arreglo verificado
rige lo construido y probado: **fail-closed.** Es la cláusula de ADR-093 §9:
*«este ADR se cumple entero o no se cumple»*.

**Lo que esta opción cuesta, para que la firma sea informada:**

- **Bajo la firma ya no queda NINGUNA parada automática ante una barrera rota.**
  Con las otras opciones el fail-closed sobrevivía al menos en el caso sin
  arreglo; con esta, tampoco ahí. `guardBarrera` sigue en el código como red de
  los caminos sin firma, y §3.2 ya midió que hoy ninguno la dispara.
- **Junta con la casilla 1(a), dicho sin rodeos:** cuando ADR-092 exista, FORTRESS
  podrá actuar en producción sobre un proyecto cuya barrera declarada está
  muerta, sin más freno que el tribunal y el recibo. En raisen-nucleo esa barrera
  es la de `supabase/migrations/`. Es decisión del dueño; que lo sea a sabiendas.
- **El arreglo que salga del debate lo aplica el proceso principal** —el agente no
  escribe en `.claude/`, medido (§3.4)—. O sea: FORTRESS escribiría en la
  configuración de Claude Code del proyecto **un contenido redactado por un
  modelo a partir de páginas web**. Un hook es código que corre en cada llamada a
  herramienta, con los permisos del operador, en todas las sesiones futuras de
  ese proyecto: es la escritura más sensible del sistema, y el CLI protege
  `.claude/` precisamente contra ella. El arreglo de §3.4 cambia **una palabra
  que FORTRESS comprobó**; este no. **Qué se le permite cambiar a la cadena
  —¿solo la línea de comando?, ¿nunca el cuerpo del guion?— no está decidido, y
  se decide antes de construirla.**
- **La documentación externa es entrada NO confiable** (§5.3), y aquí entra a la
  reparación de una guarda de seguridad. Una instrucción leída en un foro no es
  una orden. Rigen las reglas de §5.3, y hoy ningún spawn lleva herramientas de
  red.
- **El recibo del último eslabón es el más sonoro del sistema**, no una nota: va
  en el parte del lote y en la observación; dice qué barrera estaba muerta, qué
  se intentó, y que FORTRESS siguió sin ella. Determinista —`matcher`, guion,
  intérprete—: lo que FORTRESS ya lee.

---

## 4. DECISIÓN 3 — El clic de producción es del dueño

**La firma por adelantado cubre, en principio, también lo irreversible** —un
`db push` a producción—, porque autónomo significa *«actúa como yo»*. Dónde pone
la firma lo decide el operador:

- **(a) Firma el proyecto entero.** FORTRESS hace todo, producción incluida.
- **(b) Se reserva un segundo clic solo para producción**, si **él** quiere ese
  punto de control.

**El (b) es una herramienta del dueño. No es una exigencia del sistema.**

**Decidido al firmar (§12): (a).** Se ejerce cuando exista ADR-092 (§4.2), y el
dueño puede pasarse al (b) cuando quiera: es su herramienta.

### 4.1 La corrección, escrita entera

Quien asesoraba estas decisiones —el rol de CTO, humano o asistente— venía
presentando el segundo clic como un **límite del sistema**: algo que FORTRESS
*no podía* hacer sin confirmación. **Era una decisión del dueño disfrazada de
límite**, y es la cuarta forma del freno disfrazado: llega con una razón que
suena responsable y le quita al operador una elección que era suya. Se corrige
aquí. **El control es de Jojo.**

### 4.2 Lo que la firma NO puede hacer — para que sea informada

Corregir el disfraz no autoriza el disfraz contrario. Tres cosas **sí** son
hechos del terreno, y ninguna se levanta firmando:

1. **Lo irreversible no tiene red.** La garantía de FORTRESS es *firma + tribunal
   + gate + git* (ADR-089). Sobre un `db push` **git no revierte nada**: la
   garantía es *firma + tribunal + recibo*. Es el mismo hueco que ADR-089
   escribió para los proyectos sin script de verificación, y se firma igual: a
   sabiendas.
2. **Bash libre sigue bloqueado por el sandbox.** Un despliegue pide comandos
   fuera de la correa (`safe-commands.ts:54`), o sea la Pieza 3 de ADR-093, que
   espera a **ADR-092**. La razón no es de dueño —ADR-093 ENMIENDA 2—: sin
   aislamiento un proceso **ve el disco entero**. **La firma autoriza; el sandbox
   contiene. Esta enmienda no funde lo segundo en lo primero.** Y la correa está
   medida, no supuesta: en `-p` + `acceptEdits` un `… db push` vuelve *«This
   command requires approval»* (§3.5).
3. **`bypassPermissions` sigue fuera.** `permission-mode.ts:30` no lo devuelve
   nunca, y Anthropic lo documenta *«only […] in isolated environments like
   containers, VMs, or dev containers»*. Que el dueño firme no convierte su
   máquina en un contenedor.

**Consecuencia honesta:** la Decisión 3 fija **de quién es la elección** desde
hoy. La **capacidad** de ejercer el (a) llega con ADR-092, no antes.

---

## 5. DECISIÓN 4 — El agente de datos y despliegue, universal

La primera pieza que nace de esta ley. **No se limita a Supabase, Railway o
Vercel**: es el especialista de datos y despliegue de **cualquier** stack,
presente o futuro. Este ADR lo **define**; construirlo es su propio arco.

### 5.1 HONESTIDAD INNEGOCIABLE: no «sabe de todos los stacks»

Un agente que promete cobertura universal **de memoria** es una pared pintada:
promete, y falla en silencio en el stack raro. El agente, en cambio:

1. **Detecta** el stack del proyecto (hoy existe `detectStack`, `stack.ts:50`).
2. **Consulta la documentación externa actual** —la oficial de cada tecnología,
   y por debajo foros y sitios— para actuar sobre hechos frescos y no sobre
   conocimiento que envejece.
3. **Declara con evidencia** qué sabe hacer y qué **no pudo verificar**, como el
   gate declara `desconocida` (ADR-091: *«se intentó y no se pudo saber»*) y el
   Escaneo declara su cobertura (ADR-082 §5).

**La documentación externa no es adorno: es cómo el agente evita ser pared
pintada.** Verifica contra la fuente en vez de heredar la premisa. Es la lección
de `38260bd`: el docblock decía que `--allowedTools` denegaba, lo repetimos, y
**pre-aprobaba**. Este mismo documento la aplica en §1.1 y §1.4: la cita de
partida no existía y las cifras no eran comparables.

Las **plantillas** por stack son un punto de partida con fecha. Una plantilla no
contrastada con la documentación vigente se declara `desconocida`, no *hecha*.

### 5.2 Corre dentro del tribunal, y bajo la firma

Productor + crítico + OMEGA (ADR-096) + gate (ADR-091) + checkpoint (ADR-079) +
recibo (ADR-093 Pieza 1) + memoria. **Ninguna acción suya llega sin pasar por
ahí**, y ninguna sin firma.

### 5.3 HILOS NOMBRADOS, para su arco

- **La documentación externa es entrada NO confiable**, y entra al prompt de un
  agente con credenciales de producción. Informa; **no manda**. Pasa por el
  saneado de toda entrada ajena, y una instrucción leída en una página no es una
  orden del operador. Un foro pesa menos que la fuente oficial, y se dice cuál
  fue.
- **Ningún spawn de FORTRESS lleva hoy herramientas de red**: `WebFetch` y
  `WebSearch` solo aparecen en el clasificador de denegaciones
  (`observacion-de-denial.ts:16`). Hay que abrirlas, y decidir qué sale en una
  consulta: **ningún dato del proyecto viaja en la búsqueda** (el cerco de
  ADR-085).
- **Las credenciales** (R1): nunca al prompt, nunca al recibo sin tachar.
- **Depende de ADR-092** por lo mismo que §4.2.
- Existe un catálogo de conectores (`connector-catalog.ts`, con Supabase). Si el
  agente lo reusa o lo sustituye es de su arco.

---

## 6. Lo que NO está en este ADR

- **Código.** Ni una línea. Define comportamiento; cada pieza es arco aparte.
- El **Motor** y **LOOP** (doctrina de los dos mundos: el Motor es solo FORTRESS
  sobre sí misma).
- La degradación por `selfRepo`. Intacta.
- Un **campo de dueño**. Descartado en ADR-093 ENMIENDA 2; sigue descartado.
- El **sandbox**. Es ADR-092, y sigue pendiente.
- El lote **supervisado** que edita con media firma (§3.6).

---

## 7. Alternativas consideradas

### 7.1 Mantener el fail-closed siempre — RECHAZADA por el operador
Es lo construido y probado en vivo. Se rechaza porque sobre un proyecto firmado
detiene a FORTRESS ante algo que el dueño arreglaría con una palabra: parar y
esperar al humano *«es supervisado con otro nombre»* (ADR-090 §0). **Lo que se
pierde, dicho:** la única parada automática que hoy actúa (§3.2).

### 7.2 Distinguir propio de ajeno con un campo — RECHAZADA, y ya lo estaba
ADR-093 ENMIENDA 2. No se reabre.

### 7.3 Un clic de producción obligatorio — RECHAZADA
Es el disfraz de §4.1. Queda como opción (b), del dueño.

### 7.4 Un agente que «sabe de todos los stacks» — RECHAZADA
Pared pintada (§5.1).

### 7.5 Que el modelo arregle el hook — DESCARTADA, por la documentación y por la corrida
El CLI protege `.claude` (§3.4). Se leyó en la fuente y **se midió en vivo**: aquí
la corrida confirmó a la documentación —con `--allowedTools` la había
desmentido, y por eso se midió—. Queda una vía que **no** se recorre a propósito:
`Bash` sí escribe donde `Edit` no llega (§3.5). Arreglar una barrera esquivando
otra protección es justo lo que este ADR no autoriza. Y un arreglo determinista
es mejor recibo que una edición redactada.

---

## 8. Consecuencias

**Se gana:** un lote sobre proyecto firmado deja de morir por una palabra; el
operador recupera una elección que se le presentaba como imposible; el agente de
despliegue nace con la disciplina del Escaneo y no con una promesa.

**Se paga, y se firma sabiéndolo:**
- el fail-closed deja de actuar donde hoy actúa (§3.2) — y, si se marca la cadena
  de §3.7, en todo lo firmado;
- un cliente marcado de confianza recibe arreglos en su `.claude/` (§3.3);
- sobre lo irreversible la garantía pierde a git (§4.2);
- el ensayo del 21-sep sigue probando que la guarda **funciona**, pero deja de
  describir lo que FORTRESS **hará** en ese mismo escenario.

---

## 9. El principio que cierra

**El estándar de robustez de toda la app —Terminal, motor, LOOP, datos,
despliegue— es la página de Escaneo.** Cada parte es tan profunda, precisa y
robusta como el Escaneo cuando corre dentro de la misma disciplina: medir antes
de afirmar, declarar lo que no se pudo saber, y no dar por hecho lo heredado.

**FORTRESS no gana por un modelo más potente. Gana porque ninguna respuesta
llega sin pasar por su tribunal.** Eso es lo que ningún modelo solo tiene.

---

## 10. Referencias verificadas

**Código**, contra `main@247611f` (comprobadas por máquina el 2026-09-21):
`src/domain/settings/modo-efectivo.ts:32-35`, `:39-44`, `:57-62`, `:60` ·
`src/domain/repair/confianza.ts:19-21` · `src/domain/project/project.ts:33-37` ·
`src/domain/settings/terminal-puede-resolver.ts:23-25`, `:24` ·
`src/application/settings/modo-guardado.ts:33-35` ·
`src/infrastructure/barrera-guard.ts:26`, `:35`, `:40`, `:54` ·
`src/infrastructure/project/barreras-del-proyecto.ts:16-18` ·
`src/domain/project/barrera-rota.ts` (`alternativa`) ·
`src/presentation/services/turno-del-lote.ts:40` ·
`src/domain/settings/permission-mode.ts:30` ·
`src/domain/settings/safe-commands.ts:54` · `src/domain/project/stack.ts:50` ·
`src/domain/connectors/connector-catalog.ts` ·
`src/domain/chat/observacion-de-denial.ts:16` · commit `38260bd`.

*Las líneas de `barrera-guard.ts` y `turno-del-lote.ts` cambian en la rama
`fix/lote-negado-deja-constancia` (`1b3caef..4cd46ba`), comiteada y sin mergear a
esta fecha.*

**Base** (`fortress.db`, solo lectura): proyecto `93f7675b`, `trusted = 1`;
`operation_mode = autonomo`; `agent_runs` y `self_observations` del ensayo.
**Disco**: `git check-ignore` sobre `.claude/settings.json` en los dos proyectos.

**Externas**, leídas el 2026-09-21:
`code.claude.com/docs/en/security` y `…/permission-modes` — **leídas
directamente**. `…/hooks` y las cifras de SWE-bench Pro — **por un agente
delegado**, no por quien redacta; la letra pequeña va en §1.4 y §3.5.

**Medido en vivo** (2026-09-21, seis turnos reales del CLI 2.1.278 en directorios
desechables, $0,23 en total, `-p` + `acceptEdits`, entorno sin las `CLAUDE*` de
la sesión):
- el esquema `{"decision":"block"}` con `exit 0` **sí** niega un `Edit` (§3.5);
- el agente **no** puede escribir en `.claude/`: ni `Edit` de `settings.json` ni
  `Write` de un fichero nuevo (§3.4);
- una escritura por `Bash` **esquiva** un hook cuyo `matcher` no lo nombra (§3.5);
- un comando que **no** es de ficheros (`… db push`, contra un binario falso) se
  **niega**: *«This command requires approval»* (§3.5). El `supabase` real de la
  máquina no se ejecutó: se midió por ruta explícita al falso y con un nombre que
  no existe en ningún otro sitio, porque el shell del CLI rehace el `PATH`.

`src/infrastructure/claude-code/build-allowed-tools.ts:64-66` y
`src/domain/settings/safe-commands.ts:44-48`, contra `main@247611f`.

**No medido, y dicho:** los mismos casos de `Bash` lanzados por FORTRESS y no a
mano —se infieren de sus argumentos, no se corrieron— · el canal indirecto por
un `npm run` pre-aprobado · si `bypassPermissions` cambiaría
el resultado de `.claude/`, que este ADR no usa (§4.2).

---

## 11. Relación con otras decisiones

- **ADR-089** — la firma era la garantía; aquí es además la autorización.
- **ADR-090 §0 / ADR-093 §0** — la ley, enmendada con el cuarto disfraz.
- **ADR-093 ENMIENDA 2** — se respeta entera: sin campo de dueño, y el sandbox
  sigue siendo la única dependencia de Bash libre.
- **ADR-092** (pendiente) — sin él, la Decisión 3(a) y la Decisión 4 no se ejercen.
- **ADR-079** — define la red; §3.4 nombra dónde no llega.
- **ADR-091 / ADR-082** — de ahí sale la honestidad del agente de la Decisión 4.
- **ADR-096 / ADR-097** — el tribunal bajo el que corre todo lo de aquí.
- **`docs/DEUDAS.md`**, registro del fail-closed — se enmienda al construir.

---

## 12. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-21 por orden del operador, con su línea literal:

> *«firmo: 1(a), 2 cadena §3.7, 3, 4 y 5 leídas — Jojo, dueño y operador del
> proyecto FORTRESS, 2026-09-21»*

1. **El clic de producción por defecto:** [x] (a) la firma cubre producción ·
   [ ] (b) segundo clic solo para producción. *(Se ejerce con ADR-092.)*
2. **Barrera rota sin arreglo verificado** (§3.4): [ ] sigue el fail-closed ·
   [ ] sigue sin la barrera, con recibo, a secas · [x] **la cadena de §3.7**:
   documentación → web → debate → OMEGA, y solo entonces sin la barrera con
   recibo; mientras no esté construida entera, fail-closed · [ ] otra: ________
3. **He leído §3.2:** firmar retira el fail-closed del único sitio donde hoy
   actúa. [x]
4. **He leído §3.3:** un cliente marcado de confianza recibe el arreglo. [x]
5. *(Solo si marcaste la cadena.)* **He leído lo que cuesta, en §3.7:** bajo la
   firma no queda ninguna parada automática ante una barrera rota, y el arreglo
   del debate lo escribe FORTRESS en `.claude/` con contenido de un modelo. [x]

**Firma del operador:** Jojo, dueño y operador del proyecto FORTRESS ·
**Fecha:** 2026-09-21
