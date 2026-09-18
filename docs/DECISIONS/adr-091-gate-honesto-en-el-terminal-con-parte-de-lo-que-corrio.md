# ADR-091 — Gate honesto en el Terminal, con parte de lo que corrió

- **Estado**: Aceptada
- **Fecha**: 2026-09-18
- **Alcance**: Terminal — el gate que decide si lo editado se conserva
- **Relación**: aplica ADR-090 §0 · reusa la doctrina del gate del Motor ·
  deja al ADR-092 (sandbox) la frontera que no se construye aquí
- **Nace de**: el primer ensayo en vivo del Arco 5 (raisen-nucleo, 18-sep), que
  reveló el punto ciego del gate — y, al medirlo, desmintió la causa que
  creíamos (§2).

---

## §0 — LA LEY

Dictada por el operador. Es la raíz de este ADR y no se negocia.

> Todo proyecto que FORTRESS trabaja es de Jojo, de producción, de confianza.
> Un proyecto de confianza **NO lleva topes, frenos ni límites** — como se le
> quitaron a la página de Escaneo, que desde entonces da hallazgos más profundos,
> de grado bancario real. Aplica por igual a Terminal (supervisado y autónomo),
> LOOP y Motor.
>
> El Terminal tiene la **MISMA capacidad** que Jojo con `claude -p`: corre lo que
> necesite. Atar un agente Opus para que no haga lo que sabe hacer sería un
> **FRENO DISFRAZADO** (ADR-090 §0).

**Complemento — el recibo.** «Sin frenos» gobierna lo que el agente **puede
hacer**. **Saber qué corrió NO es un freno**: es la otra mitad del grado
bancario. Un banco deja la transacción hecha **y da el recibo**; si solo hiciera
una de las dos no sería un banco. El parte registra lo que corrió, nunca
silencio.

**Complemento 2 — el multiplicador.** «13 agentes» **no** es «13× más potente».
Son el mismo `claude -p` con Opus, con el mismo sesgo, repetido: trece copias
cometen los mismos errores trece veces, en coro. El multiplicador real del
multi-agente es el **DESACUERDO** —roles opuestos, ADR-090 §2— y no el número.
**No se usa «13×» para saltarse ninguna verificación.**

---

## 1. Estado medido: lo que el Terminal YA puede hacer

Esta sección existe porque **nadie lo había medido**, y tanto el operador como
el CTO creían lo contrario. Se mide antes de decidir.

Medido en `agent_runs` sobre los dos turnos del ensayo del 18-sep
(`project_id` de raisen-nucleo, columna `tools`):

| turno | vueltas | herramientas que USÓ |
| --- | --: | --- |
| 01:52:36 | 18 | `Bash` (~120 invocaciones), `WebFetch` ×4, `WebSearch` ×4, `Agent` ×3 (subagentes), `Read`, `Write`, `ToolSearch`, MCP del grafo |
| 02:03:51 | 51 | `Bash` (~40), `Read`, `Edit`, `Write`, `mcp__codebase-memory__get_architecture` |

**El agente tuvo Bash libre.** Hizo `curl` a los dos dominios de producción para
comprobar qué cabeceras llegan de verdad, y **corrió `npm install`** cuando le
faltaron las dependencias. Nadie se lo impidió.

Por qué: `build-allowed-tools.ts:23` devuelve, en `acceptEdits`, las tools de
lectura del grafo más la autoverificación. `--allowedTools` **añade lo que se
auto-aprueba; no restringe** — y `acceptEdits` deja pasar el resto.

Y `safe-commands.ts` no es lo que parecía:
- `:9-13` — las tres intenciones de verificación (`typecheck`, `lint`, `test`).
- `:38` — la regla exacta `Bash(npm run ${found})`.
- `:54` — el **interruptor** `mode === 'acceptEdits' && trusted`, no el allowlist.

**No es una correa que impida instalar.** Cualquier lectura previa que dijera lo
contrario queda corregida aquí.

### La causa falsa, anotada para que no se grabe

Antes de medir, el diagnóstico en curso era: *«el agente no pudo correr
`npm install` porque `safe-commands.ts` no se lo permitía; hay que quitarle la
correa»*. **La medición lo desmintió**: la correa no existe y el agente ya
instala. Se registra aquí, con su nombre, porque una causa falsa descartada en
un ADR vale más que una causa falsa que nadie contradice — y porque el mismo
ADR habría «arreglado» algo que no estaba roto, dejando el fallo real intacto.

**Queda EXPLÍCITAMENTE FUERA de este ADR «quitar la correa».** No hay correa.

---

## 2. La causa real: el gate castiga al agente por el árbol que encontró

En el ensayo el turno **instaló, editó 3 ficheros y no falló** — `failed=0` en
las dos filas de `agent_runs`. Y aun así revirtió.

`desenlace-del-turno.ts:45`:
```ts
const rojo = outcome.failed || (edito && !(await red.verificar(cwd)))
```
Con `failed=0` y `edits=3`, el único camino a `rojo` es **`red.verificar` en
falso**: el typecheck salió rojo. Y `:46` corta antes del juez:
```ts
if (rojo || !edito || juez === null) return { rojo, veredicto: SIN_JUZGAR }
```

Consecuencia medida: **cero corridas de `sentinel-omega`** ese día, en ningún
proyecto. **OMEGA no llegó a juzgar.** El único ramal que los tests no cubren
—OMEGA contestando sobre un diff real— **sigue sin probarse**.

### Lo que el gate no sabe distinguir

`build-verify.ts:24-29` es todo el gate del Terminal:
```ts
const salida = await runCommand('npm', ['run', 'typecheck'], cwd, TIMEOUT_MS)
if (salida.code === 0) return true
return /missing script/i.test(salida.out)
```

Ya degrada honestamente en **un** caso: si el script no existe, se da por bueno.
Pero hay tres casos, no dos, y se midió cada uno contra raisen-nucleo:

| caso | hoy | qué es en verdad |
| --- | --- | --- |
| Script ausente | `missing script` → **se da por bueno** | correcto |
| **Herramienta ausente** | `rc=127`, `sh: 1: tsc: not found`, **cero coincidencias** con `missing script` → **revierte** | no se pudo verificar |
| Rojo heredado real | el typecheck corre y reporta errores previos → **revierte** | no lo causó el fix |

El ensayo cayó en el **segundo**: `raisen-nucleo` tiene script `typecheck`
(`tsc --noEmit`), así que no es «missing script» — corre, y sin `node_modules`
muere con `tsc: not found`. **El turno estaba condenado a revertir antes de la
primera edición**, y ninguna de las 51 vueltas del productor podía cambiarlo.

**Eso es un freno disfrazado de la misma familia que los tres ya muertos**: no
limita cuánto explora ni qué puede hacer, pero **castiga al agente por el estado
previo del árbol**. Un fix correcto se pierde porque el proyecto no traía con qué
compilarse. El gate del Motor ya sabe que eso está mal, y lo dice
(`gate-sequence.ts:41-43`):

> *«exigirle a un fix que deje verde un árbol que ya estaba rojo antes de tocarlo
> es pedirle que arregle el proyecto entero para poder arreglar una línea»*

---

## 3. Decisión — el gate honesto, dos piezas

### Pieza 1 — `FASE_DESCONOCIDA`

Cuando el gate **no puede correr** una fase —herramienta ausente, `rc=127`,
dependencias del propio proyecto rotas—, esa fase **no cuenta como rojo y no
revierte el turno**.

Se llama **DESCONOCIDA y no OMITIDA** a propósito: «omitida» suena a decisión de
alguien, «desconocida» dice la verdad — se intentó y no se pudo saber.

**Y VIAJA.** Al parte del lote, a Historia y a la UI, con texto que un
no-técnico entienda: *«instalé las dependencias para poder verificar»*, *«no pude
verificar: el proyecto no tiene con qué compilarse»*. **Prohibido que se lea como
verde.**

Esto tiene un precio y se dice aquí en vez de descubrirlo en producción: **lo
conservado bajo `FASE_DESCONOCIDA` pasó por OMEGA pero nadie verificó que
compile**. OMEGA lee un diff; no construye nada. Es mejor que revertir un fix
correcto por un rojo ajeno, pero no es gratis, y por eso el operador tiene que
poder verlo en el parte.

### Pieza 2 — Heredado / propio, traído al Terminal

Se reusa la doctrina del Motor (`gate-sequence.ts:27,36-43,59`): **un rojo
HEREDADO no corta; un rojo PROPIO corta en el acto**. Si todo lo que falló era
heredado, el gate pasa.

Lo que **no** se reusa es el mecanismo de medida. `medirHerencia` visita la base
con `git checkout baseSha` en el mismo directorio. En el Motor es un worktree
aislado; **en el Terminal es el árbol vivo del cliente**, y hacer checkout ahí es
justo lo que ADR-079 existe para impedir.

Un worktree temporal tampoco sirve, y falla de la peor manera: **no tendría
`node_modules`** (está gitignored), así que el typecheck fallaría siempre allí,
todo saldría «heredado» y el gate **absolvería cualquier fix**. Absolución falsa,
peor que el problema.

**La medida correcta es la que el Terminal puede permitirse y el Motor no:**
medir la línea base **al abrir el checkpoint, antes de que el agente edite**.
Mismo árbol, mismo `node_modules`, misma máquina — la única diferencia entre las
dos medidas son las ediciones del agente. Es exactamente la propiedad que
`medirHerencia` persigue (*«se visita la base en el mismo sitio, que es lo único
que hace comparables las dos salidas»*), y aquí sale gratis: sin checkout, sin
stash, sin worktree.

Cuesta una corrida de gate por turno. Para un turno que dura 500 s y cuesta
$2.72, es ruido.

---

### ENMIENDA — 2026-09-18: la Pieza 2 del §3 queda DIFERIDA

*Lo de arriba se conserva tal como se firmó. Esta enmienda dice qué se construyó
y qué no, y por qué — un ADR que se corrige en silencio no deja aprender del
error.*

**Al intentar construirla, la medición desmintió dos cosas que este ADR daba por
buenas.** Los tests existentes cazaron las dos antes de que llegaran a `main`.

**(a) «Cuesta una corrida de gate por turno […] es ruido» era optimismo, no un
dato.** El párrafo de arriba se escribió pensando en raisen-nucleo, donde `tsc`
muere en menos de un segundo porque no hay dependencias. En un proyecto que **sí**
compila, `tsc` tarda entre 30 y 180 s, y medir la base antes de cada turno lo
**duplica**: en un lote de diez hallazgos son hasta media hora de espera, y el
90 % tirada — la base solo importa cuando el gate posterior sale rojo, que es el
caso raro. No es un freno (no limita nada), pero es un peaje real que entró en un
ADR firmado sin medirse.

**(b) Y lo grave: «heredado conserva» afloja una defensa de ADR-079.** Con base
roja y resultado rojo se conserva; en un proyecto que no compila de base —o sea,
en **todos** sus turnos— el gate deja de opinar por completo y OMEGA queda como
juez único de algo que nadie compiló. El test `typecheck en rojo: revierte`
pasaba a conservar.

Eso **no es traer la doctrina del Motor: es traer media**. El Motor puede
conservar un heredado con seguridad porque compara el TEXTO de los dos rojos
(`ruidoPropio`, `gate-baseline.ts`): sabe si el fix añadió ruido en los ficheros
que tocó. El Terminal no puede hacer esa comparación sin volver a visitar la base
**después** de editar, que es el `git checkout` sobre el árbol vivo que ADR-079
prohíbe. Sin ella, «heredado conserva» es ciego: conservaría igual un fix que
**empeoró** un árbol ya roto.

**Y el caso que motivó este ADR no era un rojo heredado: era un `desconocida`.**
`tsc: not found` lo cubre la Pieza 1 del §3, construida y en verde. La Pieza 2
resolvía un caso **que no hemos visto ni una vez**, y para resolverlo pagaba el
doble gate y aflojaba una garantía real.

**DECISIÓN ENMENDADA.** En el Terminal, **el rojo SIEMPRE revierte**, como hoy.
`FASE_DESCONOCIDA` cubre el único caso real observado (herramienta o script
ausente). La distinción heredado/propio **queda diferida**.

**Condición de activación, explícita para que no vuelva por costumbre:** reaparece
solo si surge un proyecto con rojo heredado REAL, donde importe distinguir «el
fix lo empeoró» de «ya estaba así». Entonces se vuelve **con la medición de ese
caso** y se decide entre `ruidoPropio` en el Terminal, un worktree con
dependencias cacheadas, u otra vía — **nunca** `git checkout` sobre el árbol vivo.

**Lo que SÍ se construyó y queda:** el vocabulario de tres estados
(`VerificacionDelArbol`) y `FASE_DESCONOCIDA` con su recibo. Lo diferido es
únicamente heredado/propio.

---

## 4. El recibo (innegociable)

**Todo lo que el agente corre sin el operador delante queda en el parte del lote
y en Historia.**

Con `Bash` libre, `WebFetch`, `WebSearch` y subagentes en juego —medido en §1—,
el parte deja de ser cortesía: **es la única forma de saber qué pasó**. El
operador no estaba mirando; el registro es su única ventana.

Registrar no frena: no le quita al agente una sola capacidad. Es lo que separa
una herramienta de seguridad de un troyano bienintencionado.

---

## 5. Frontera asumida, no construida aquí — ADR-092 (sandbox)

El operador **ya tiene clientes**: en la misma máquina conviven código de más de
un dueño. Y el aislamiento hoy no existe. Medido, `gate-env.ts:32-36`:

> *«LIMITE, que conviene no confundir: esto ACOTA EL ENTORNO, no encierra al
> proceso. El código del repo sigue corriendo con el usuario y **ve el disco
> entero**: puede leer `~/.ssh`, `~/.aws` o lo que haya. […] Contener de verdad
> exige un sandbox, y eso es otra pieza de otro tamaño.»*

Y no es teórico: `gate-env.ts:28-30` deja constancia de que el `npm ci` del gate
ejecuta a propósito los scripts del `package.json` auditado, y de que **un
`preinstall` de prueba leyó `SSH_AUTH_SOCK` sin esfuerzo**.

Consecuencia: **el `postinstall` del proyecto de un cliente puede leer el de
otro cliente.** Y conviene decirlo entero — **instalar no es capacidad nueva**:
el gate del Motor ya corre `npm ci` sobre el repo auditado. Lo que falta no es
permiso, es **aislamiento**.

Aislar eso es el **SANDBOX**, es **ADR-092**, es su propio arco, y **no se
construye aquí**.

### REGLA PUENTE (innegociable hasta que exista el ADR-092)

- Mientras ADR-092 no exista, FORTRESS **en AUTÓNOMO no corre install ni
  postinstall sobre un proyecto cuyo código no sea del operador**.
- Sobre proyectos **del operador** (un solo dueño): **todo abierto**, la ley §0
  entera.
- En **SUPERVISADO**, con el operador delante: **cualquier proyecto** — el que
  mira es él.

Es una **frontera provisional, no un freno a la ley** (ADR-090 §3: un freno
limita lo que se puede hacer; una frontera es saber qué se hizo y dónde). Cae
cuando el sandbox la haga innecesaria.

---

## 6. Alternativas consideradas

**a) Que el gate instale las dependencias él mismo antes de medir.**
Descartada por innecesaria, no por peligrosa: §1 mide que **el agente ya
instala**. Un gate que instalase por su cuenta duplicaría lo que el agente hace
mejor —él sabe qué le falta y por qué— y añadiría un actor más corriendo
`postinstall` ajeno.

**b) Que el turno no arranque si el árbol no compila de base.**
Tentador y más barato: ahorraría los $2.72 y los 508 s del ensayo. Descartada
por doctrina: es **el mismo freno con otro nombre** — castiga al fix por el
estado previo del árbol. Un proyecto sin `typecheck` no es «terreno no apto»: es
un proyecto donde esa fase no aplica, y tiene hallazgos reales que resolver.

**c) Dejar el gate como está y que OMEGA lo compense.**
Descartada: OMEGA no compila. Sin gate honesto, o se revierte todo fix sobre
árbol imperfecto, o se conserva sin verificar nada. Las dos son peores.

**d) Quitar la correa de comandos.**
**No existe correa.** Ver §1. Registrada como causa falsa descartada.

---

## 7. Consecuencias

**A favor**
- El turno llega al juez. **OMEGA podrá juzgar un diff real por primera vez** —
  el ramal que ningún test cubre y que sigue sin probarse.
- Un fix correcto deja de perderse por el estado previo del árbol.
- El operador ve en el parte qué se verificó, qué no, y por qué.
- Se reusa doctrina probada del Motor en vez de inventar mecánica.

**En contra, dicho sin suavizar**
- **`FASE_DESCONOCIDA` debilita la garantía** cuando aparece: lo conservado pasó
  por OMEGA pero nadie lo compiló. Por eso viaja al parte en vez de callarse.
- Una corrida de gate más por turno (la línea base al abrir el checkpoint).
- La regla puente del §5 es una restricción real sobre proyectos de clientes, y
  vivirá hasta que el 092 exista. Escribirla es preferible a que el `postinstall`
  de un cliente lea el repo de otro.

---

## 8. Referencias verificadas

Comprobadas contra `eb6ef93` antes de escribirse.

| Ref | Qué dice |
| --- | --- |
| `agent_runs` (2 filas, 18-sep, raisen-nucleo) | `Bash` ~160, `WebFetch`, `WebSearch`, `Agent`, `Edit`, `Write`; `failed=0`, `edits=3` |
| `build-allowed-tools.ts:23` | en `acceptEdits`, grafo + autoverificación; `--allowedTools` añade, no restringe |
| `safe-commands.ts:9-13,38,54` | tres intenciones; regla `Bash(npm run …)`; interruptor `acceptEdits && trusted` |
| `desenlace-del-turno.ts:45-46` | `rojo` sale de `red.verificar`; el gate corta antes del juez |
| `build-verify.ts:24-29` | todo el gate del Terminal; solo degrada por `missing script` |
| `gate-sequence.ts:27,36-43,59` | heredado no corta, propio sí; si todo era heredado, el gate pasa |
| `gate-env.ts:25-36` | acota el entorno pero **no encierra**; el `preinstall` leyó `SSH_AUTH_SOCK` |
| medición directa sobre raisen-nucleo | `npm run typecheck` → `rc=127`, `sh: 1: tsc: not found`, 0 coincidencias con `missing script` |

---

## 9. Relación con otras decisiones

- **Aplica** [ADR-090](adr-090-el-terminal-autonomo-juzga-debate-y-reintenta-sin-parar.md)
  §0 (la ley) y §3 (fronteras no son frenos).
- **Desbloquea** la Fase A del ADR-090: sin gate honesto, el turno nunca llega a
  OMEGA y las Fases B y C se estrellarían en el mismo typecheck.
- **Respeta** [ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md):
  la línea base se mide sin `git checkout` sobre el árbol vivo.
- **Reusa** la doctrina del gate del Motor, sin tocar el Motor.
- **Delega** al ADR-092 el sandbox, y deja la regla puente mientras no exista.
