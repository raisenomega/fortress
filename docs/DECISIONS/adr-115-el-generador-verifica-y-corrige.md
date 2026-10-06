# ADR-115 — El generador verifica y corrige: el reparto antes de construir

- **Fecha:** 2026-10-05 (medido sobre `main@fd44fca`)
- **Estado:** Propuesta, sin firmar. Las piezas (A) no tocan defensas y se pueden
  construir sin firma; las (B) necesitan la firma del operador, pieza a pieza; las
  (C) quedan aparcadas, cada una para su propio ADR.
- **Área:** Motor
- **Enmienda:** ADR-110 (el lazo del Motor), en la pieza B2.

## 1. Contexto: los 7 rechazos de la tanda en opus

El re-drenaje del 2026-10-05 fue el primero con el modelo declarado (33 corridas
de 33 en `claude-opus-5-5`). De 12 propuestas, 5 llegaron a la firma y 7 cayeron:

| Propuesta | Hallazgo | Caída | Lectura |
|---|---|---|---|
| `4ef566f5`, `73cb105c`, `433f3c8f` | `electron-builder.yml:72`, el AppImage sin firma ni procedencia | dos vetos de OMEGA y un «sin diff» | **Irresoluble** para el Motor: pide una clave, verificar en `install.sh` y un ADR, es decir, una decisión del operador. Se intentó tres veces, unos $2,8. |
| `5ad61a15`, `6a886e5a` | `scripts/fase-b-agente.ts` | lint: 87 y 92 líneas, máximo 75 | **Salvable.** El arreglo necesitaba partir el fichero y la correa no deja crear uno nuevo. |
| `b9a60bd9` | `scripts/medir-deriva.ts:46` | lint: falta un tipo de retorno en el `.spec.ts:13` | **Salvable.** Un error trivial que el generador no vio. |
| `74cf61e0` | `spawn-entorno-acotado.test.ts:24` | test:unit rojo | **Salvable, y falso rechazo.** Ver §5. |

**Diagnóstico, confirmado contra el código:**

1. **El generador escribe a ciegas.** Su única entrada de Bash es la correa de npm
   para el lock (ADR-111). Cualquier otra orden, `eslint`, `tsc` o `vitest`, pide
   una aprobación que en modo headless nadie da. No puede comprobar lo que entrega.
2. **El primer rojo del gate es terminal.** La propuesta muere sin que el
   generador vea el error. La vuelta de ADR-110 solo se abre con un PARCIAL de
   OMEGA, nunca con un rojo del gate.

## 2. El mapa: ocho piezas

Defensa sí/no, medido con `defensasQueToca()` fichero a fichero.

| # | Pieza | Ancla | ¿Defensa? | Clase |
|---|---|---|---|---|
| A1 | El gate guarda las líneas del error | `spawn-command-hijo.ts:45-50` guarda solo los últimos `TAIL_CHARS = 2000` (`gate-config.ts:18`); en lint el error queda enterrado bajo los warnings | No | **A** |
| A2 | Los números en el prompt del generador | `generator-prompt.ts:28` dice solo «limite de lineas»: ni 75 por fichero, ni 50 por función, ni tipos de retorno explícitos | No | **A** |
| A3 | El desacuerdo de OMEGA, visible en la firma | Se escribe en `run-omega-emit.ts:25-35` (`omega_verdict_mismatch`) y nadie lo lee; su sitio es `OmegaVerdictTable.tsx` | No | **A** |
| B1 | Triaje que no vuelve a elegir lo irresoluble | `bloqueo-por-rechazo.ts` (`INTENTOS_POR_CAUSA = 2`, cuenta por **causa**); al medirlo, también `run-omega-judge.ts`, `repair-rejection.ts` y `clasificacion-de-baja.ts`. `elegir-objetivo.ts` no cambia | **Sí** (solo el freno) | **B** |
| B2 | Gate rojo → reanudar al generador con el error | El corte, en `run-motor-chain.ts:60-61`; la maquinaria de reanudar ya existe en `con-lazo.ts:33-50` | No, pero es doctrina de ADR-110 | **B** (enmienda) |
| B3 | El generador se verifica a sí mismo en la caja | `motor-tools.ts:39,47` (solo `NPM_SOLO_LOCK`) + `generator-args.ts:26` (`--allowedTools`); la caja de ADR-092 lo contendría | **Sí** | **Descartada** (2026-10-06) |
| C1 | «Depende de»: rescate por dependencia | No existe | — | **C** |
| C2 | Permitir un fichero hermano en la correa | `allowed-files.ts` + `scope-check.ts` | **Sí** | **C** |

## 3. Decisión: el reparto

### (A) Sin firma, aplicables ya

- **A1.** El gate conserva, además de la cola, **las líneas que son error**: las de
  eslint marcadas `error`, las `error TS` de tsc y los fallos de vitest. Es lo que
  hace leíble un rojo, y es la entrada que B2 necesita para funcionar.
- **A2.** El prompt del generador dice los números del repo: 75 líneas por fichero,
  50 por función y tipos de retorno explícitos, con la receta de extraer un helper.
  Ayuda, pero no verifica: por sí sola no basta.
- **A3.** Cuando las reglas (D19) y el razonamiento del agente de OMEGA no
  coinciden, la tabla del veredicto lo enseña en la firma. **La regla D19 no se
  toca**: el veredicto lo sigue calculando el Motor a partir de los ejes. Lo que
  cambia es que el desacuerdo deja de ser un evento que nadie lee. En toda la
  historia hay 3 casos y ninguno llegó a firmarse.

### (B) Con firma del operador

- **B1. El triaje por hallazgo y base, no por causa suelta** (afinado al medirlo a
  nivel de línea el 2026-10-05). El freno contaba los rechazos de la **misma causa**
  sobre la misma base, y en `electron-builder` las causas se alternaron (veto, «sin
  diff», veto) y el tercer intento se coló. Tras el tope del 23-ago hay 3 casos así
  en la historia. El diseño construido tiene dos piezas:
  1. **Una sola cuenta para las causas de razonamiento** (`omega_vetado`,
     `scope_violation`, `no_diff_produced`, `solo_pruebas`) por hallazgo y base, con
     el mismo tope de 2. Las **averías** (`provider_error`, `analisis_ilegible`)
     siguen contando cada una por su lado: un 429 no dice nada del arreglo y no
     debe gastarle el presupuesto. Sin esa separación, un veto seguido de un solo
     «ilegible» habría quedado en pausa.
  2. **«Resuelve: NO» va por el motivo, no por el freno.** El eje solo vivía en la
     evidencia del evento de OMEGA, y el freno solo ve los campos de la propuesta.
     El juicio escribe ahora `omega_no_resuelve`, que no es reintentable, y el
     freno ya existente lo pausa desde el primer rechazo. Hay 6 vetos así en la
     historia, entre ellos el primer intento de `electron-builder`.

  Sigue siendo una **pausa, no una extinción**: si el HEAD avanza, el hallazgo
  vuelve a la baraja, y la cuenta empieza de cero en la base nueva.
- **B2. El rojo del gate deja de ser terminal, dentro de los topes que ya existen**
  (construido el 2026-10-05; la enmienda está en ADR-110 §10). Al medirlo salió
  que no bastaba con cambiar el disparo: el gate ya cerraba la propuesta en
  RECHAZADO antes de que nadie pudiera reanudarla. El diseño construido:
  - el gate **aplaza** el rechazo de un rojo de código con líneas (solo cuando lo
    pide la cadena del Motor; el botón manual no cambia) y la propuesta se queda
    en GENERADO;
  - una arista nueva, `GENERADO → GENERADO`, para la vuelta; RECHAZADO sigue sin
    salida;
  - el mismo `decidirOtraVuelta`, con los topes compartidos con el PARCIAL;
  - un encargo propio y honesto, saneado con `sanearCampoDePrompt`;
  - y si no hay vuelta, el rechazo aplazado se escribe idéntico al de siempre.

  Al construirlo salió un hueco que **ya existía**: el encargo del PARCIAL
  (`objecion-de-omega.ts:24`) metía la razón de OMEGA dentro de su bloque con
  `aplanarParaPrompt`, que impide abrir una línea pero no cerrar el bloque desde
  dentro de la misma. Su test lo fijaba como correcto. **Cerrado el 2026-10-05**:
  la razón pasa por `sanearCampoDePrompt`, igual que el encargo del rojo, y las
  dos vías del encargo quedan blindadas por igual. Efecto visible: las comillas
  invertidas de la razón le llegan al generador como comillas simples, el mismo
  trato que ya reciben los campos del análisis.
- **B3. La auto-verificación en la caja: DESCARTADA el 2026-10-06**, con la medida que
  pedía esta misma sección. Quedó diferida a la espera de volver a medir, porque su
  precondición era cara: cuando corre el generador, el árbol de trabajo **no tiene
  `node_modules`** (el `npm ci` solo ocurre dentro del gate), así que lanzar eslint
  o vitest antes del gate exigiría instalar en cada generación.

  **La medida, de los vigías de los dos drenajes posteriores a A1 y B2:**

  | Drenaje | Llegaron al gate | Verde a la primera | Rojo de código | Rojo de infraestructura |
  |---|---|---|---|---|
  | 2.º (2026-10-05) | 3 | 2 | 0 (el único rojo fue un lint matado por un Detener, §7) | 0 |
  | 3.º (2026-10-06) | 21 | **19** | **1**, resuelto por B2 | 1 (`npm ci` con ECONNRESET) |

  El único rojo de código (`7ed12397`, `head-sha.ts:13`, `test:unit`) lo resolvió
  B2 con una vuelta y el error delante, por $1,30 en total. El rojo de
  infraestructura no lo habría evitado ninguna auto-verificación. **No quedó ningún
  caso que una verificación antes del gate hubiera evitado y B2 no.** Los 19 verdes
  a la primera ocurrieron con A2 en vigor; que se deban a A2 es probable, pero no
  está medido contra un control.

  **Decisión:** A1 (las líneas de error), A2 (los números en el prompt) y B2 (la
  vuelta con el error real) cubren lo que B3 pretendía, sin pagar una instalación
  en cada generación. B3 se descarta.

  **Reversible:** se reabre si un drenaje trae un rojo de código que B2 no logra
  resolver y que una verificación previa sí habría cazado.

### (C) Aparcadas, cada una con su ADR

- **C1. «Depende de» (prioritaria).** Un arreglo que destapa a un hermano abierto
  debe quedar «depende de X», volver a medirse encima de X cuando X entre, y poder
  rescatarse sin regenerar. Se apoya en la sonda del árbol combinado de la guía de
  firma.
- **C2. El fichero hermano.** Que la correa admita un módulo nuevo en la carpeta
  del ancla y con su prefijo, para que un arreglo que no cabe en 75 líneas pueda
  partir el fichero. Toca la correa del alcance.
- **C3. El reintento entre bases (nueva, salida al medir B1).** Como cada avance
  del HEAD pone la cuenta a cero, un hallazgo puede comprarse indefinidamente:
  `a2b7c74f` (Genesis) acumuló 17 propuestas en 11 bases, ninguna integrada. Pero
  el mismo mecanismo es el que dejó entrar Electron: `9e64bb68` lo intentó en 8
  bases, cayó 6 veces en `npm ci` por la caché y entró a la novena. **No se cierra
  a ciegas:** un tope de por vida habría matado ese éxito. Tampoco basta la pausa
  de B1 para los hallazgos que necesitan una decisión del operador (como
  `electron-builder`), porque se levanta en el siguiente merge. Pide su propio
  ADR: un tope de gasto por hallazgo, o un estado «necesita decisión humana».

## 4. Orden de construcción

1. **A1, A2 y A3**, sin firma.
2. **B1, el triaje**, con firma.
3. **B2, la vuelta tras el rojo**, con firma y enmienda de ADR-110.
4. ~~Volver a medir B3~~: medido en los drenajes 2.º y 3.º y **descartada** (§3, B3).
5. **C1, C2 y C3** van aparte, cada una con su ADR.

Cada pieza sigue el método del repo: test rojo, arreglo, mutante que muere, gate.

## 5. El falso rechazo `74cf61e0`, y por qué no es un bug

El arreglo amplía el barrido de spawns para reconocer `execFileSync`, y con eso
caza **de verdad** la fuga de `git-snapshot.ts`. Esa fuga era otro hallazgo, el de
`88e17331`, que no estaba en la base `0c36571` sobre la que se midió. **Sobre ese
árbol el rojo era cierto**: ni el gate ni el lazo se equivocaron. El hueco es de
orden, y es lo que C1 cierra.

Medido el 2026-10-05: el commit del arreglo (`a6b8f05`), aplicado sobre `fd44fca`
(que ya contiene `88e17331`), pasa **45 de 45**. El hallazgo sigue abierto y,
como el HEAD avanzó, ha vuelto a la baraja. Regenerarlo cuesta alrededor de $1 y
rescatar el commit costaría cero. Es una decisión menor que puede quedar para el
próximo drenaje.

## 6. Pieza A4, añadida al construir A3: el gate no corría los tests `.tsx`

Al escribir el test de A3 salió un hueco del propio gate. `vitest.config.ts`
incluía solo `src/**/*.test.ts`, así que **7 ficheros `.test.tsx`, con 11 tests,
no corrían nunca**:

- `construir/ConstruirInput`, `graph/GraphAbBox`, `settings/ApiKeyForm`,
  `settings/ApiKeyVerdictNote`, `system/CapabilityNotes`, `system/AgentDraftEditor`
  y `system/ProposeCapability`. Los dos últimos entraron con la tanda del
  2026-10-05 (`80d5d174`, `3561099e`).

**Los 7 los escribió el propio Motor**, uno por cada arreglo de accesibilidad
(commits `repair(…)` del 02 al 05-oct). La correa de `allowed-files.ts` le permite
`<ancla>.test.tsx` cuando el ancla es un `.tsx`, el generador escribe ahí su test,
y el gate del Motor usa esta misma configuración. **Cada arreglo de UI del Motor
entró sin que su propio test se ejecutara una sola vez.**

Medido antes de tocarlo: `vitest.config.ts` no es defensa, y los 11 pasan verdes
y estables (cuatro corridas de la suite entera con los `.tsx` dentro: 931 de 931
ficheros, 6250 de 6250 tests, sin un flake). No necesitan jsdom ni dependencias
nuevas.

**Decisión (A, sin firma):** el `include` pasa a `src/**/*.test.{ts,tsx}`, con un
test que deriva del disco todos los ficheros de test de `src/` y exige que cada
uno case con el `include` real. Tapa a la vez el gate humano y el del Motor,
porque comparten la configuración.

**Lo que estos tests son, sin adornar:** son tests de **texto**. Leen el fuente
del componente y comprueban que el atributo está (`aria-label`, `role`…). Desde
ahora protegen contra que alguien quite ese atributo. **No prueban la
accesibilidad real** de la UI renderizada. Hacerlos de render es otro alcance.

## 7. El falso rechazo por cancelación (2026-10-06)

En el segundo drenaje con B1 y B2, `36d0061a` (`fase-b-agente.ts:41`) cayó con
`gate_failed_at=lint`, y el arreglo era bueno: fuera del gate, el mismo worktree
pasa el lint con 0 errores. El lint del gate murió a los 26 s sin imprimir nada.

**La cadena, medida en el código:** Detener (`repair-drain-handler.ts:55`) →
`cancelRun` → `killChildrenOf(proyecto)` (`run-control.ts:50-53`, SIGTERM y a los
3 s SIGKILL) → los comandos del gate van registrados con el proyecto como dueño
(`gate-runner.ts`, `gate-sequence.ts`) → el cierre llegaba con `code = null` y
`spawn-command-hijo.ts` apuntaba `code ?? 1`: **la señal se perdía** y un lint
muerto quedaba como un lint rojo. El drenaje acabó ahí y se relanzó a los 9
minutos, que es el hueco sin eventos de esa noche.

**Descartado con datos:** un kill por memoria (el kernel no registra ninguno), el
script `limpia-ram.sh` del cron (no mata procesos y corrió después), el tope del
bucle y cualquier límite de la caja (no tiene). Veredicto: **solo clasificación y
evidencia**, sin tope que subir. Ningún fichero tocado es defensa.

**El arreglo (sin firma, 0 defensas):**

- El resultado de cada comando **conserva la señal** que lo mató (`senal`).
- Un comando muerto por una señal que no es el reloj del gate es
  **`gate_detenido`**, no `gate_failed`. Se clasifica **antes** de medir si el
  rojo era heredado, porque esa medición volvía a ejecutar el comando sobre la
  base. Un `exit` distinto de cero **sin** señal sigue siendo `gate_failed`, y un
  timeout sigue siendo `gate_timeout`.
- La propuesta queda **CADUCADA**, no RECHAZADA, con la señal en la evidencia y el
  veredicto del análisis intacto: el hallazgo vuelve a la baraja y no cuenta en
  el freno de B1.
- El libro **guarda** las líneas de error de A1 y la señal de cada comando, solo
  cuando las hay.

**Deuda que queda, sin arreglar:** `killChildrenOf(proyecto)` mata a **todos** los
hijos del proyecto, no solo a los del run que se para. Parar un turno del
Terminal, un build, un escaneo o la verificación de hallazgos sobre el mismo
proyecto también mata un gate del Motor en curso. Con este arreglo esa muerte ya
no se toma por un rojo, pero el gate sigue muriendo. Acotar el kill al run
correcto es otra pieza, con su propio ADR.
