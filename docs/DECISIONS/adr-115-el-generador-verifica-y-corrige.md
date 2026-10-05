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
| B1 | Triaje que no vuelve a elegir lo irresoluble | `bloqueo-por-rechazo.ts` (`INTENTOS_POR_CAUSA = 2`, cuenta por **causa**) + `elegir-objetivo.ts` | **Sí** | **B** |
| B2 | Gate rojo → reanudar al generador con el error | El corte, en `run-motor-chain.ts:60-61`; la maquinaria de reanudar ya existe en `con-lazo.ts:33-50` | No, pero es doctrina de ADR-110 | **B** (enmienda) |
| B3 | El generador se verifica a sí mismo en la caja | `motor-tools.ts:39,47` (solo `NPM_SOLO_LOCK`) + `generator-args.ts:26` (`--allowedTools`); la caja de ADR-092 lo contendría | **Sí** | **B**, diferida |
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

- **B1. El triaje por objetivo y base, no por causa.** El freno de hoy cuenta los
  rechazos con la **misma causa** sobre la misma base. En `electron-builder` las
  causas se alternaron (veto, «sin diff», veto) y el tercer intento se coló. La
  decisión es contar los rechazos del hallazgo sobre la misma base, sea cual sea
  la causa, y que un veto de OMEGA con `resuelve_el_hallazgo: NO` pause el
  hallazgo desde el primero. Sigue siendo una **pausa, no una extinción**: si el
  HEAD avanza, el hallazgo vuelve a la baraja.
- **B2. El rojo del gate deja de ser terminal, dentro de los topes que ya existen.**
  Enmienda de ADR-110: un rojo de lint, typecheck o test reanuda la sesión del
  generador con las líneas de A1 como encargo, igual que hoy lo hace un PARCIAL
  con la objeción de OMEGA. Los topes **no cambian**: 2 vueltas, $5 por propuesta,
  $0,70 de margen. Un timeout o un fallo de `npm ci` siguen siendo terminales:
  son del entorno, no del arreglo.
- **B3. La auto-verificación en la caja queda DIFERIDA, con condición escrita.**
  Su precondición, medida y nunca escrita: cuando corre el generador, el árbol de
  trabajo **no tiene `node_modules`**, porque el `npm ci` solo ocurre dentro del
  gate. Lanzar eslint o vitest exigiría instalar antes, o reaprovechar la
  instalación. Por eso se construyen primero A1 y B2, y en el drenaje siguiente
  se **vuelve a medir** cuántos rechazos siguen cayendo por errores que una
  auto-verificación previa habría cazado. Si la cifra lo justifica, B3 vuelve con
  su diseño de la instalación.

### (C) Aparcadas, cada una con su ADR

- **C1. «Depende de» (prioritaria).** Un arreglo que destapa a un hermano abierto
  debe quedar «depende de X», volver a medirse encima de X cuando X entre, y poder
  rescatarse sin regenerar. Se apoya en la sonda del árbol combinado de la guía de
  firma.
- **C2. El fichero hermano.** Que la correa admita un módulo nuevo en la carpeta
  del ancla y con su prefijo, para que un arreglo que no cabe en 75 líneas pueda
  partir el fichero. Toca la correa del alcance.

## 4. Orden de construcción

1. **A1, A2 y A3**, sin firma.
2. **B1, el triaje**, con firma.
3. **B2, la vuelta tras el rojo**, con firma y enmienda de ADR-110.
4. **Volver a medir B3** en el drenaje siguiente.
5. **C1 y C2** van aparte, cada una con su ADR.

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
