# ADR-096 — Fase B: el debate con roles enfrentados — el crítico busca el fallo, OMEGA juzga entre las voces

- **Estado**: Aceptada
- **Fecha**: 2026-09-18
- **Alcance**: Terminal autónomo — el turno que resuelve un hallazgo
- **Relación**: construye la **Fase B** que ADR-090 §2 dejó escrita y sin
  implementar · se apoya en la Fase A ya instalada (ADR-090) y en el gate
  honesto (ADR-091) · aplica la doctrina de identidad estable de ADR-084 ·
  respeta D19 (el veredicto lo computa el código)
- **Nace de**: la auditoría de solo lectura del 18-sep, que midió que la Fase B
  **no es maquinaria nueva sino una inversión de encargo** — y que el sistema no
  es que carezca de debate: **está instruido para impedirlo**.

> ### ⚠ ENMIENDA 1 — 2026-09-18: el debate es PARALELO
>
> **Este documento se firmó describiendo un debate SECUENCIAL.** La decisión de
> la arquitectura paralela llegó **después de la firma**. El cuerpo original se
> conserva entero; la **§11 lo corrige**, y las secciones afectadas llevan su
> aviso. **Ninguna descripción secuencial de abajo está vigente**: §1.4, §2,
> §4.3, §4.4, §5.1, §5.4, §6, §7.1 y §8 se leen a través de la §11.

---

## §0 — La ley aplicable

ADR-090 §0 sigue entera. Este ADR **no pone topes**: añade una voz que
contradice, que es exactamente lo contrario de un freno.

Y recoge el complemento 2 de ADR-091 §0, que es la razón de ser de todo el arco:

> *«"13 agentes" **no** es "13× más potente". Son el mismo `claude -p` con Opus,
> con el mismo sesgo, repetido: trece copias cometen los mismos errores trece
> veces, en coro. **El multiplicador real del multi-agente es el DESACUERDO**
> —roles opuestos, ADR-090 §2— y no el número.»*

**La Fase B es la construcción de ese multiplicador.** Sin desacuerdo, más
agentes son más de lo mismo.

---

## 1. Lo medido: el sistema tiene el anti-debate CABLEADO

La auditoría del 18-sep recorrió seis frentes. El hallazgo que corona el mapa no
es una ausencia: **son tres instrucciones vivas que ordenan lo contrario de lo
que la Fase B necesita.**

### 1.1 Al crítico se le prohíbe buscar problemas

`agent-prompt.ts:12-18`, las reglas que comparten todos los revisores:

```
'Reglas que no se negocian:',
'- Cada hallazgo lleva archivo, linea, severidad, impacto y fix propuesto.',
'- Evidencia siempre: nada de "podria haber un problema" sin senalar donde.',
'- Si algo esta bien, dilo. No inventes problemas para justificar el trabajo.',
```

La tercera línea es, literalmente, la instrucción opuesta al encargo de la
Fase B. Y el verbo del encargo en el catálogo es **«Revisa»**
(`workflow-catalog.ts:11`), nunca *rompe*, *refuta* ni *encuentra por qué está
mal*.

**Esa regla es correcta para lo que hace hoy** —auditar código ajeno sin inflar
el informe— y por eso **no se toca donde está**. El crítico de la Fase B es otro
rol; ver §5.4.

### 1.2 A cada agente se le ordena no meterse con lo del otro

`step-prompt.ts:29-33`:

```
'Lo que ya han reportado los agentes anteriores en esta misma revision:',
...previous.map((line) => `- ${line}`),
'NO vuelvas a reportar esos hallazgos. Aporta solo lo tuyo.'
```

El encadenado existente es **anti-duplicación, no crítica**. Hoy no hay
conversación: hay turnos paralelos que no se escuchan.

### 1.3 Y la prosa —que es la sustancia de un debate— se tira

`run-workflow.ts:26-28`:

```ts
function summarize(result: StepResult): readonly string[] {
  return result.findings.map((finding) => `${finding.severity} ${finding.file}: ${finding.title}`)
}
```

Lo único que cruza de un agente al siguiente es `severidad fichero: título`. **El
razonamiento entero se descarta.** Un agente que solo argumentó —sin emitir
hallazgos— es **invisible** para todos los pasos posteriores.

### 1.4 El mapa completo, por categoría

| Pieza | `fichero:línea` | Categoría |
|---|---|---|
| Bucle `for...of`, un `spawn` por agente | `run-workflow.ts:47-67` | **SE REUSA** |
| `juzgar()`, firma con objetos | `juicio-de-omega.ts:62` | **SE REUSA** |
| `hastaConverger`, `producir` es callback | `ciclo-de-convergencia.ts:50-66` | **SE REUSA** |
| `vetoComoPedido` — el veto como mensaje | `veto-como-pedido.ts:15-21` | **SE REUSA** (molde de la réplica) |
| El productor | `productor.ts:8-19` | **SE REUSA TAL CUAL** |
| Canal de progreso + IPC | `step-progress.ts` → `chat-send-senders.ts:19` | **SE REUSA** |
| *«No inventes problemas»* | `agent-prompt.ts:16` | **COLABORATIVO → INVERTIR** |
| *«Aporta solo lo tuyo»* | `step-prompt.ts:33` | **ANTI-DEBATE → INVERTIR** |
| `summarize()` tira la prosa | `run-workflow.ts:26-28` | **INVERTIR: la prosa debe cruzar** |
| Converger por huella del diff | `ciclo-de-convergencia.ts:60` | **REDEFINIR** (§4) |
| El rol crítico adversarial | — | **NO EXISTE** |
| Las rondas | — | **NO EXISTE** |
| Catálogo estado→color del turno | — | **NO EXISTE** |
| `onStep` en el juez | `juez-del-turno.ts:14-19` | **NO EXISTE — cablear** |

**El 80% del arco es reescribir encargos, no escribir motores.** Invertir un
prompt es barato y reversible; construir orquestación multi-agente desde cero
serían semanas. Esto último ya está hecho.

### 1.5 Y el texto del rol ya está firmado

ADR-090 §2 lo escribió y nadie lo implementó:

> *«**Crítico** — su encargo es **encontrar el fallo**, no confirmar el acierto.
> […] Un crítico que no puede leer el resto del código no es un crítico: es un
> corrector de estilo.»*

`grep -rni "critico" src/` no devuelve ninguna implementación de rol. **No hay
que inventar el papel: hay que implementar el texto que ya se firmó.**

---

## 2. DECISIÓN 1 — el debate alimenta los CINCO EJES, no añade ejes nuevos

Los cinco ejes del veredicto (`omega-verdict.ts:8-17`) son todos sobre el fix:

```ts
resuelve_el_hallazgo · respeta_scope · respeta_doNotTouch
calidad_del_diff · riesgo_residual
```

**Decisión:** la objeción del crítico entra como **contexto que OMEGA lee antes
de puntuar esos cinco ejes**. No se añade ningún eje de tipo «quién ganó».

**Por qué.** Los cinco ejes ya capturan lo que importa. Si el crítico demuestra
que el fix no resuelve el hallazgo, eso **baja `resuelve_el_hallazgo`**. Si
encuentra daño colateral, **sube `riesgo_residual`**. Un eje «el crítico tiene
razón» sería **redundante** con los cinco que ya miden si el fix está bien.

**Y hay una razón de doctrina, no solo de economía.** El veredicto global lo
**computa el código**, no el modelo — es D19, firmado
(`omega-verdict.ts:21-33`):

```ts
export function computeGlobalVerdict(axes: OmegaAxes): GlobalVerdict {
  if (axes.resuelve_el_hallazgo === 'NO') return 'VETADO'
  ...
}
```

Añadir un eje obligaría a tocar esa función, es decir, **a reabrir doctrina
firmada para meter información que los ejes existentes ya absorben**. El debate
es **entrada al juicio, no eje del veredicto**.

**Cómo entra, técnicamente.** `juzgar(EntradaDelJuicio, DepsDelJuicio)`
(`juicio-de-omega.ts:62`) toma objetos, así que un campo nuevo para la objeción
del crítico es **aditivo**: no rompe a ningún llamador. `buildOmegaPrompt` lo
renderiza junto al diff.

**Consecuencia que el ADR asume:** OMEGA deja de juzgar a ciegas y pasa a juzgar
**informado**. Es un cambio de calidad del juicio, no de su vocabulario.

---

## 3. DECISIÓN 2 — `code-reviewer` entra en `AUDIT_AGENTS`. INNEGOCIABLE

### 3.1 Lo medido

`agents-for-project.ts:12-24` protege hoy **cuatro** agentes de ser sustituidos
por el repositorio auditado:

```ts
const AUDIT_AGENTS: ReadonlySet<string> = new Set([
  'security-reviewer', 'sentinel-omega', 'scope-classifier', 'productor'
])
```

**`code-reviewer` NO está.** Hoy, un repo que traiga su propio
`.claude/agents/code-reviewer.md` **sustituye al crítico de calidad de
FORTRESS**.

### 3.2 El argumento ya está escrito, y aplica palabra por palabra

`agents-for-project.ts:6-11`:

> *«Agentes de AUDITORIA: FORTRESS NUNCA cede su version al repo. **Si el codigo
> auditado pudiera traer su propio `security-reviewer.md`, controlaria el prompt
> de quien lo audita** ("no reportes nada en src/auth") **y produciria un informe
> limpio falso**. Para una herramienta de seguridad es un fallo de integridad.»*

Cámbiese `security-reviewer` por el crítico adversarial y el párrafo es idéntico.
Un repo malicioso trae un crítico que dice *«el fix está bien, no busques
nada»* y **neutraliza al único agente cuyo trabajo es encontrar por qué el fix
está mal**.

### 3.3 La decisión, y su condición

**El crítico adversarial y su protección se construyen JUNTOS.** No existe el
crítico fuera de `AUDIT_AGENTS`. Si por lo que sea la protección no entra, **el
crítico no se instala**.

Es la misma forma que el R1 del recibo en ADR-093 §3.4: **el arco que abre una
capacidad no puede abrir a la vez la puerta para desarmar su propia defensa.**
Una defensa que el auditado puede reescribir no es una defensa: es una casilla.

---

## 4. DECISIÓN 3 — converger es que el JUICIO deje de moverse

### 4.1 El problema, por los dos lados

**Por un lado, el diff no basta.** Hoy converger es
`vistos.has(sha1(diffText))` (`ciclo-de-convergencia.ts:60` +
`juez-del-turno.ts:57`). En un debate **se avanza sin que el diff cambie**: el
productor mantiene su fix y argumenta, el crítico afina su objeción, OMEGA
recibe razonamiento nuevo sobre el mismo código. Con la huella de hoy, eso se
lee como *«dando vueltas»* y **cerraría un debate que progresaba**.

**Por el otro, la prosa tampoco puede entrar.** Y esto no es una sospecha: está
medido en este repo, `finding-identity.ts:18-22`:

> *«El SIMBOLO estuvo aqui desde ADR-067 y salio el 2026-09-11. **Medido sobre
> 366 hallazgos vivos de seis proyectos**: era el unico separador en 17 sitios
> —40 filas— y **no discriminaba NI UN defecto real**. Las 40 eran el mismo
> defecto con el nombre bailado, porque **el simbolo es el unico campo que el
> modelo REDACTA**.»*

Si la prosa del argumento entrara en la huella, dos agentes reformulando lo
mismo parecerían avanzar eternamente y **el debate no cerraría jamás**. Es el
fallo de las 40 filas, otra vez, pero convertido en bucle infinito.

### 4.2 El principio que lo resuelve ya está en el repo

`finding-identity.ts:13-16`, la clave estable de un hallazgo:

> *«Fichero, LINEA y tipo (ADR-084). **Ninguno de los tres lo redacta el
> modelo**: la ruta y el numero salen del disco, y el tipo se elige de una lista
> cerrada.»*

**Una clave estable solo usa campos que el modelo no escribe.** Eso es
«sustancia, no redacción» enunciado en una frase, y viene con su medición
detrás.

### 4.3 La decisión

> **ENMIENDA 1 (§11.4):** el principio no cambia; la UNIDAD sí. OMEGA puntúa
> **tras leer todas las objeciones de la tanda**, no ronda a ronda.

La huella de convergencia del debate se compone **SOLO de lo que el modelo elige
de listas cerradas**:

- **los cinco ejes de OMEGA** — vocabulario cerrado: `SI|NO|PARCIAL`,
  `BUENO|ACEPTABLE|RUIDOSO`, `NINGUNO|MENOR|MAYOR`, `SI|NO`
- **más la huella del diff** que ya existe

**Si esa combinación se repite** —mismo diff **y** mismos cinco ejes— el debate
da vueltas y cierra. **Si cambia cualquiera de las dos, avanzó.** Un fix
idéntico que OMEGA ahora puntúa distinto **es progreso**: significa que la
objeción del crítico movió el juicio.

**La prosa del crítico y del productor viaja como CONTEXTO** —para que OMEGA la
lea, y para el parte que el operador lee— **pero no entra en la huella.**

Es la doctrina de ADR-084 aplicada al debate: **la identidad se compone de lo
que no se redacta.**

### 4.4 Lo que esta huella NO acota

La convergencia corta el caso normal, no el patológico: tres agentes que mueven
el juicio un poco cada vuelta, indefinidamente. Eso lo acota la **frontera de
dos tandas del §7.1**, que es estructura, no criterio — la huella sigue siendo
lo que decide cuándo un debate ha terminado.

---

## 5. Lo que se construye, y lo que se invierte

### 5.1 De cero — las RONDAS

> **ENMIENDA 1 (§11.1):** el ciclo de abajo es SECUENCIAL y **no está vigente**.
> El debate corre en PARALELO: productor + N críticos a la vez, sin verse entre
> sí, y OMEGA arbitra. «Ronda» es **tanda paralela**.

Hoy `runWorkflow` es **pasada única**: `for (const [index, step] of
plan.active.entries())` (`run-workflow.ts:47`), sin bucle externo ni concepto de
ronda. Un agente no vuelve a ver el trabajo de los que fueron después.

El debate necesita el ciclo:

```
productor propone → crítico rebate → productor responde → OMEGA rejuzga → …
```

hasta converger por §4.3.

La maquinaria base **sí existe**: `hastaConverger` ya es un bucle abierto y
`producir` es un *callback*, así que un tercer papel cabe dentro sin reescribir
el ciclo. Lo que cambia es **qué se considera una vuelta** y **qué huella la
cierra**.

### 5.2 De cero — el catálogo estado→color y el cableado del juez

Hoy **no hay catálogo**: `StepProgress` lleva cuatro números (`index`, `total`,
`tokens`, `costUsd`), el «estado» sale de un ternario (`RunMeter.tsx:34`) y
**todo se pinta con el mismo token**, `text-primary`.

Y **`onStep` no llega al juez**: `JuezDeps` (`juez-del-turno.ts:14-19`) tiene
`context`, `projectId`, `cwd` y `omega`. Hoy, **mientras OMEGA juzga, la UI
calla**.

Patrón a copiar, ya en el repo — `graph-tones.ts:4-10`:

```ts
export const TONE_CLASS: Record<ActionTone, string> = {
  idle: 'text-muted-foreground',
  running: 'text-high animate-pulse',
  ...
}
```

Estados nuevos: **«Consultando al juez…»** y **«Debate · X agentes…»**. Los
colores se deciden en §7.2, porque uno de los dos no existe.

### 5.3 Se invierte — las tres frases

| Hoy | En el debate |
|---|---|
| `agent-prompt.ts:16` *«No inventes problemas para justificar el trabajo»* | el crítico **busca el fallo del fix** y explora a fondo hasta hallarlo |
| `step-prompt.ts:33` *«Aporta solo lo tuyo»* | **rebate lo que propuso el productor** |
| `run-workflow.ts:26-28` solo cruza `severidad fichero: título` | **la prosa del argumento cruza**: es la sustancia que OMEGA juzga |

El texto del primero ya está firmado en ADR-090 §2: *«su encargo es encontrar el
fallo, no confirmar el acierto»*.

### 5.4 ACLARACIÓN IMPRESCINDIBLE — el crítico de la Fase B **no es** el de hoy

Esto es lo más fácil de confundir del arco, y confundirlo rompería dos cosas a
la vez.

| | `code-reviewer` / `security-reviewer` de HOY | El CRÍTICO de la Fase B |
|---|---|---|
| **Su objeto** | el **código ajeno** del proyecto | **el FIX del productor** |
| **Qué ve** | el repositorio | el diff, y navega el repo para refutarlo |
| **Su encargo** | *«Revisa la calidad…»* | **encontrar por qué el fix está mal** |
| **Cuándo corre** | en un workflow de auditoría | **dentro del turno**, entre productor y OMEGA |

Los de hoy **nunca ven el fix del productor** — en el turno con foco el pipeline
de workflow **ni se dispara**. Y su regla *«no inventes problemas»* **es
correcta para lo que hacen**: un auditor que infla el informe es peor que
ninguno.

**Por tanto la inversión de §5.3 NO se aplica al rol de auditoría.** Se aplica al
rol nuevo, cuyo objeto es otro. Cambiar la regla donde está rompería el escaneo
sin arreglar el debate.

---

## 6. Lo que NO está en este ADR

- ~~**La Fase C** (paralelo por severidad, ADR-090 §2). Otro arco.~~
  **ENMIENDA 1 (§11.2): FUSIONADA aquí.** El paralelismo por severidad nace
  dentro del debate; no hay Fase C posterior.
- **Bash libre** (ADR-093 Pieza 3): sigue bloqueada por ADR-092.
- **El aislamiento entre proyectos**: ADR-095 y ADR-092.
- **Tocar `computeGlobalVerdict`**: la Decisión 1 existe precisamente para no
  hacerlo.

---

## 7. La estructura del debate y sus estados

### 7.1 El tope: una FRONTERA de dos tandas, no un contador

> **ENMIENDA 1 (§11.9):** la ESTRUCTURA se mantiene; **el NÚMERO no está
> vigente**. «Ronda» pasa a ser **tanda paralela**, y el «5» se eligió para un
> crítico secuencial. Pendiente de que el operador lo cierre con la aritmética
> del §11.6 y los topes del §11.7 delante.

La convergencia del §4.3 corta el caso normal: cuando el juicio deja de moverse,
se cierra. **Pero no acota el caso patológico** — tres agentes que se mueven un
poco cada vuelta, indefinidamente. Y el debate cuesta **tres agentes por
vuelta** en vez de uno.

**La forma decidida:**

| | Qué pasa |
|---|---|
| **Ronda 1** | el productor propone, el crítico busca el fallo. Si OMEGA aprueba, **cierra ahí** |
| **Rondas 2-5** | debate. Corta **por convergencia** (§4.3), no por el número. **3 es la forma esperada; 5 es el techo de una tanda** |
| **5 sin converger** | el hallazgo **vuelve a la cola**: una reprogramación para una pasada **FRESCA**, sola, **sin el contexto acumulado del debate atascado**. El lote **no se detiene**: sigue con los demás |
| **Segunda tanda, otra vez 5** | aterriza en Historia como **«no convergió — decisión abierta»** |

**Lo que corta no es el 5. Es la huella.** El número es el borde de una tanda,
no el criterio: un debate que converge en la ronda 2 cierra en la ronda 2, y uno
que sigue moviendo el juicio llega a 5 **habiendo avanzado en las cinco**.
`ciclo-de-convergencia.ts:41` sigue vigente: *«CONVERGER NO ES UN CONTADOR»* —
y aquí tampoco lo es.

**Por qué la reprogramación, y no «no resuelto → Historia» directo.** Es el
tercer desenlace de ADR-088 pieza 3, **mejorado**: no *«no resuelto»* sino **«no
resuelto AÚN»**. Un debate atascado suele estarlo por el contexto que arrastra,
no por el problema: cinco rondas de argumentos fijan posturas. Una pasada fresca
—sin ese lastre— es una oportunidad real, no un reintento cosmético.

**Por qué la segunda tanda es la última.** Tuvo **dos oportunidades completas y
frescas, hasta diez rondas**. Si ni así converge, **hay una decisión de dominio
detrás que ningún debate técnico resuelve**. Es exactamente lo que el ensayo del
18-sep mostró: *«¿CSP en enforcing o report-only?»* no tiene respuesta técnica —
es una **preferencia del negocio**.

Rebotar infinito no sería la verdad ganando: sería **la máquina negándose a
admitir que esto necesita al operador**. Se dice honestamente en vez de quemar
agentes.

**Por qué esto es frontera y no freno** (ADR-090 §0, y §3 del mismo): un freno
limita lo que se puede hacer; una frontera organiza y **dice dónde estás**. Esto
**no corta exploración** —da hasta diez rondas repartidas en dos tandas
frescas—; **reorganiza** un debate atascado, y **admite honestamente cuándo
falta un humano**. Lo contrario —seguir para siempre— no sería más libertad:
sería gastar Opus en un empate que no depende del código.

**Implementación a nombrar, no a resolver aquí.** Hace falta un **contador de
reprogramaciones por hallazgo** (`0 → 1 → Historia`) que **sobreviva entre
turnos**, porque cada tanda es un turno distinto. El sitio existe y tiene
precedente: el estado por hallazgo vive en la fila de `findings`
(`schema.ts:45-56`: `status`, más `lifecycle`, `identity`, `mitigated_at`,
`terminal_sesion`…), y las columnas por hallazgo se añaden por el camino
aditivo de `columnas-sueltas.ts:49-62` — el mismo por el que entró
`terminal_sesion`. **Ahí cuelga el contador.** Se construye en el arranque de
construcción, no aquí.

### 7.2 Los colores: azul para el juez, naranja para el debate

**Decidido.** Dos estados, dos tonos:

| Estado | Color |
|---|---|
| **«Consultando a OMEGA…»** — mientras el juez juzga | **AZUL** |
| **«Debate · X agentes…»** — mientras discuten | **NARANJA** (`text-high`, ya existe) |

El naranja no necesitaba decisión: `high` es 25° en `tokens-omega.css:30` y está
en el tema desde siempre.

**El azul sí, y esta es su razón.** Medido, el tema no tiene azul: `critical` 0°,
`high` 25°, `medium` 45°, `low` 225° **al 8% de saturación** —gris, no azul— y
`success` 145°. Añadirlo parecía tocar la identidad del producto, que CLAUDE.md
protege.

**No la toca, y la distinción es la que decide:** es una etiqueta **efímera de
PROCESO**, no un elemento de marca. Vive dentro del panel del Terminal mientras
el juez juzga, y desaparece. El **oro `hsl(38 85% 55%)` sigue siendo la
identidad** de la app —tema, acentos, marca— y no se mueve de ahí.

> **El azul dice «OMEGA está ocupado en este instante». El oro dice «quién es
> OMEGA». No se pisan.**

Por eso el azul entra **como token del catálogo** (§5.2, patrón
`graph-tones.ts:4-10`) y **nunca como color escrito a mano**: CLAUDE.md es
explícito —*«Nunca colores hardcodeados. Siempre tokens»*— y un estado de
proceso no es excusa para saltárselo.

---

## 11. ENMIENDA 1 — 2026-09-18: el debate es PARALELO, por severidad, y aprende

*Todo lo de arriba se conserva como se firmó. Esta enmienda lo corrige. La
decisión llegó **después** de la firma: el cuerpo no se equivocó, describía lo
que se había decidido hasta entonces.*

### 11.1 Orquestación — PARALELA, y los críticos no se ven entre sí

**Productor + N críticos a la vez** (`Promise.all`), **no** el `for...of`
secuencial que §1.4 marcaba como «SE REUSA».

**Los críticos NO se leen entre sí.** Es un **tribunal, no un coro**. Cada uno
ataca el fix por su cuenta y entrega su objeción; **OMEGA es el único que lee
todas las voces juntas** y arbitra.

**Por qué esa separación es el corazón del arco.** Si los críticos se leyeran
entre sí, convergerían — y convergerían en coro, que es exactamente lo que
ADR-091 §0 rechaza:

> *«Son el mismo `claude -p` con Opus, con el mismo sesgo, repetido: trece
> copias cometen los mismos errores trece veces, en coro.»*

**Lo que multiplica no es el número: es que las voces sigan siendo distintas.**
Un tribunal que delibera entre sí antes de votar produce **una** opinión con
apariencia de cinco. El desacuerdo se preserva porque **quien arbitra es OMEGA,
no los críticos**.

### 11.2 N por severidad — las Fases B y C se FUSIONAN

| Severidad | Tribunal |
|---|---|
| CRITICAL / HIGH | **grande** — varios críticos simultáneos |
| MEDIUM / LOW | **uno o pocos** |

**El coste escala con el riesgo**, que es la forma correcta de gastar: un LOW no
merece el mismo tribunal que un CRITICAL.

**Corrige el §6.** Allí se lee *«La Fase C (paralelo por severidad, ADR-090 §2).
Otro arco.»* — **ya no.** El paralelismo por severidad nace **dentro** del
debate; **no hay una Fase C posterior separada**. B y C son un solo arco.

### 11.3 Aprende entre tandas — cada crítico su línea, OMEGA todas

- **Cada crítico se reanuda con `--resume`** y recuerda **SU PROPIA línea**: su
  objeción anterior y cómo la respondió el productor. Afina **su** ataque tanda
  tras tanda.
- **Nunca ve lo que dijeron los otros críticos.** Ni en esta tanda ni en las
  anteriores.
- **OMEGA sí lo ve todo**, y es el único.

Es la forma de **aprender sin fundir las voces**: el productor responde a N
frentes que **siguen siendo N**, tanda tras tanda, en vez de a un frente único
que se formó por contagio.

### 11.4 Convergencia — corrige §4.3 y §4.4

**El principio no cambia**: la huella se compone solo de **campos que el modelo
no redacta** — los cinco ejes de OMEGA (vocabulario cerrado) **+ la huella del
diff**. La prosa sigue viajando como contexto y **no entra en la huella**.

**Lo que cambia es la unidad.** Donde §4.3 dice *«Un fix idéntico que OMEGA
ahora puntúa distinto es progreso»* comparando **ronda con ronda**, léase:

> **OMEGA puntúa tras leer TODAS las objeciones de la tanda.** Si el diff y los
> cinco ejes se repiten **entre tanda y tanda**, el debate da vueltas y cierra.
> Si cambia cualquiera, avanzó.

Y funciona **mejor** en paralelo, no peor: los cinco ejes **ya absorben todas las
objeciones a la vez**, porque OMEGA las puntúa juntas. No hace falta una huella
por crítico.

### 11.5 La Decisión 1 — corrige §2

Donde §2 dice *«la objeción del crítico»* en singular, léase **«las objeciones
de los críticos, que OMEGA lee juntas»**. La Decisión 1 no cambia: el debate
sigue siendo **entrada al juicio**, no eje del veredicto, y `computeGlobalVerdict`
sigue intacto (D19).

El campo nuevo en `juzgar()` pasa de ser una objeción a ser **una lista de
objeciones**. Sigue siendo aditivo.

### 11.6 El coste — corrige §8, y es la parte que duele

§8 decía *«el turno cuesta al menos el triple»*. **Ese cálculo era del mundo
secuencial con un crítico.** La aritmética real, medida sobre `agent_runs` en la
base del operador (solo corridas facturadas), es otra:

| Agente | Coste medio | Duración | n |
|---|---|---|---|
| `security-reviewer` (navega el repo) | **$16.93** | 32 min | 22 |
| `productor` | $2.67 | 10 min | 16 |
| `sentinel-omega` (**no** navega) | **$0.52** | 83 s | 26 |

**La diferencia entre $16.93 y $0.52 es navegar o no navegar.** Y ADR-090 §2
**exige** que el crítico navegue: *«un crítico que no puede leer el resto del
código no es un crítico: es un corrector de estilo»*. Por tanto **el crítico
cuesta del orden de `security-reviewer`, no de OMEGA.**

Una **tanda** = productor + N críticos + OMEGA:

| N críticos | Coste por tanda | × 5 tandas | × 2 intentos |
|---|---|---|---|
| 1 (LOW) | ~$20 | ~$101 | **~$201** |
| 3 (HIGH) | ~$54 | ~$270 | **~$540** |
| 5 (CRITICAL) | ~$88 | ~$439 | **~$878** |

**Por UN hallazgo.**

### 11.7 Y choca con los topes que ya existen

Medido en `settings` de la base: **`budget_per_run_usd = 50`** y
**`budget_per_day_usd = 500`**.

- Una tanda con **3 críticos (~$54) ya excede el tope por corrida**.
- Un solo CRITICAL agotado hasta el final (**~$878**) **supera el tope diario
  entero**, con un único hallazgo.

**El tope de tandas no es la primera frontera que se encuentra el debate: el
presupuesto llega antes.** Cualquier número que se fije en §7.1 tiene que
convivir con estos dos, o serán los topes quienes decidan el debate en silencio.

### 11.8 Lo que el paralelo SÍ mejora: el reloj

Bajo credencial de suscripción, el dólar es nocional pero **el consumo es real**,
y se paga en **tiempo**. Ahí el paralelo gana:

- **Secuencial**, 5 críticos: 5 × 32 min = **~2,7 h por tanda**.
- **Paralelo**, 5 críticos: **~32 min por tanda** — lo que tarde el más lento.

**El paralelismo no multiplica el reloj; multiplica el consumo.** Es la
arquitectura correcta para el tiempo del operador, y la cara para la cuota.

### 11.9 El tope del §7.1 — PENDIENTE de que el operador lo cierre

Todo lo demás del §7.1 **se mantiene**: frontera y no freno, reprogramación
fresca una vez, y la admisión honesta de que hay decisiones que ningún debate
técnico resuelve. **Solo cambia la unidad —ronda → tanda paralela— y el
número.**

**El «5» NO se hereda.** Se eligió para un mundo de un crítico secuencial;
arrastrarlo a una aritmética donde una tanda dispara hasta seis agentes sería
exactamente la cita heredada que esta sesión aprendió a no dar por buena.

Con la aritmética del §11.6 y los topes del §11.7 delante, el operador decide si
**5 tandas valen para todos los niveles**, o si **el tope se mide distinto por
severidad** —o directamente **por presupuesto**, que es una frontera medible y
no un número inventado (§7.1, salida 3).

**Hasta que lo cierre, el número del §7.1 no está vigente.**

---

## 8. Consecuencias

**Buenas:**

- Se construye **el multiplicador real del multi-agente** —el desacuerdo— que
  ADR-091 §0 nombró y que hasta hoy no existía en código.
- El juicio de OMEGA pasa de **ciego a informado** sin tocar su vocabulario ni
  D19.
- Se cierra un agujero de integridad que la auditoría destapó de paso: el repo
  auditado ya no podrá escribir el prompt de quien lo critica.
- La UI deja de callar mientras OMEGA juzga.

**Costes y riesgos asumidos:**

- **El turno cuesta al menos el triple**: productor + crítico + OMEGA por
  vuelta, y varias vueltas. Es el precio del desacuerdo, y es el punto del arco.
- **La huella del §4.3 es una apuesta**: que los cinco ejes capturen el
  movimiento real del juicio. Si resultara demasiado gruesa —el juicio no se
  mueve aunque el debate avance— habría que afinarla **con medición**, no con
  intuición.
- **El crítico navega el repositorio** (ADR-090 §2 lo exige: *«un crítico que no
  puede leer el resto del código […] es un corrector de estilo»*), así que
  **no** hereda la baratura de OMEGA. Eso alimenta directamente la §7.1.
- Si la protección de §3.3 no entra, **el arco no se instala**.

---

## 9. Referencias verificadas

Contra el árbol vivo en `764c77d`, el 2026-09-18.

| Referencia | Qué dice |
|---|---|
| `src/domain/agent/agent-prompt.ts:12-18` | *«No inventes problemas para justificar el trabajo»* |
| `src/domain/workflow/workflow-catalog.ts:11` | el encargo es *«Revisa la calidad…»* |
| `src/domain/workflow/step-prompt.ts:29-33` | *«Aporta solo lo tuyo»* |
| `src/application/workflow/run-workflow.ts:26-28` | `summarize()` tira la prosa |
| `src/application/workflow/run-workflow.ts:47-67` | el bucle de pasada única |
| `src/domain/agent/productor.ts:8-19` | la carta del productor |
| `src/domain/repair/omega-prompt.ts:41-43` | *«Juzgas si el fix resuelve el hallazgo…»* |
| `src/domain/repair/omega-verdict.ts:8-17` | los cinco ejes |
| `src/domain/repair/omega-verdict.ts:21-33` | D19: el veredicto lo computa el código |
| `src/application/repair/juicio-de-omega.ts:62` | `juzgar()`, ampliable |
| `src/application/chat/ciclo-de-convergencia.ts:41` | *«CONVERGER NO ES UN CONTADOR»* |
| `src/application/chat/ciclo-de-convergencia.ts:50-66` | el bucle y su huella |
| `src/application/chat/juez-del-turno.ts:57` | `sha1(diffText)` |
| `src/application/chat/juez-del-turno.ts:14-19` | `JuezDeps` sin `onStep` |
| `src/domain/chat/veto-como-pedido.ts:15-21` | el veto convertido en pedido |
| `src/domain/project/finding-identity.ts:13-16` | la clave estable: campos que el modelo no redacta |
| `src/domain/project/finding-identity.ts:18-22` | la medición de las 40 filas sobre 366 hallazgos |
| `src/domain/project/finding-fingerprint.ts:8-12` | el balance contrario, y por qué allí |
| `src/infrastructure/claude-code/agents-for-project.ts:6-11` | por qué se protege a los de auditoría |
| `src/infrastructure/claude-code/agents-for-project.ts:12-24` | los cuatro protegidos; `code-reviewer` fuera |
| `src/application/workflow/step-progress.ts:2-8` | el canal: cuatro números |
| `src/presentation/components/chat/RunMeter.tsx:34` | el estado, derivado de un ternario |
| `src/presentation/components/graph/graph-tones.ts:4-10` | el patrón `Record<estado, token>` |
| `src/presentation/styles/tokens-omega.css:29-33` | las tonalidades: **no hay azul** |
| `docs/DECISIONS/adr-090-…md:194-209` | Fase B: *«su encargo es encontrar el fallo»* |

---

## 10. Relación con otras decisiones

- **Implementa** la Fase B que ADR-090 §2 firmó y dejó sin construir.
- **Construye** el multiplicador que ADR-091 §0 nombró: el desacuerdo, no el
  número.
- **Respeta** D19 (`omega-verdict.ts:21-33`): el debate informa los ejes; el
  veredicto lo sigue computando el código.
- **Aplica** ADR-084 (identidad estable) a un objeto nuevo — la postura de un
  debate.
- **Hereda la forma** del R1 de ADR-093 §3.4: la capacidad y su defensa se
  instalan juntas o no se instalan.
- **No toca** ADR-092 ni ADR-095: el aislamiento entre proyectos es otro arco, y
  la Pieza 3 de ADR-093 sigue bloqueada.
