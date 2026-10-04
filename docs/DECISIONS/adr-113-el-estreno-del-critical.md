# ADR-113 — El estreno del CRITICAL: la primera reparación de la máxima severidad, registrada

- **Fecha:** 2026-10-05 (la cadena corrió el 2026-10-04; la firma, el 04 a las 18:26 hora del operador)
- **Estado:** Aceptada (registro de hito — documenta un hecho, no abre una opción)
- **Área:** Motor

## 1. Qué registra este ADR

La **primera vez en la historia del Motor** que una propuesta de severidad
CRITICAL recorrió la cadena completa — elegida por la cola, analizada,
generada, juzgada y **firmada por el operador** — sobre FORTRESS mismo. El
asiento queda aquí, literal y con sus fuentes, porque la escalera de severidad
se pagó escalón a escalón con evidencia y este era el último.

## 2. Por qué la puerta estaba abierta (la evidencia, no la opinión)

ADR-106 §3.3 dejó la puerta de CRITICAL **condicionada a su prueba**: un HIGH
posterior al sello cruzando la cadena entera con `gate verde`, `omega aprobo`
e `integracion firmada por el operador`. La condición se **CUMPLIÓ** el
2026-10-04 con el HIGH `9f69a37c` (merge `2655c77`), verificado asiento a
asiento, y el operador firmó la subida (enmienda de ADR-106, firma literal
allí): `DEBUT = [LOW, MEDIUM, HIGH, CRITICAL]`, mergeada en `f251a9e` y en el
binario `85c09417` desde el rebuild en frío del mismo día.

## 3. El hallazgo

> **`8ad2ea05` — «Un nombre de rama con `|` falsifica el campo trusted y el
> scan ejecuta claude sobre un repo no confiable»** —
> `templates/fortress-orchestrator.sh:226`, tipo `control-evadible`.

El registro `repos.conf` de la plantilla usa `|` como separador y los campos
(`name`, `path`, `remote`, `branch`) se escribían sin validar: un valor con el
separador desplazaba las columnas y el campo 5 — el literal `trusted`, que
solo el gesto `--trust` del operador debe poner — podía quedar falsificado.
Vector REAL y **multi-cliente**: la plantilla se distribuye a terceros.

## 4. La cadena, con tiempos y dinero (UTC del 2026-10-04)

| Eslabón | Hora | Dato |
|---|---|---|
| ELEGIDO | 08:27:42 | el PRIMERO de toda la baraja — «MÁS GRAVE de los elegibles» (la autoridad de severidad de ADR-106); medido antes por el pipeline entero: era el ÚNICO CRITICAL elegible, los de `generator-args` enjaulados por `innegociables-grafo.ts:11` |
| ANALIZADO | 08:31:24 | 73.336 tok, $2.04 — verificó línea a línea que el defecto vivía, amplió el alcance a los CUATRO campos y vetó el saneo silencioso |
| Worktree | 08:31:28 | rama `repair/2c06d8b5-…`, base `c105d50` |
| GENERADO | 08:35:00 | commit `a7368bc`, **+15/−0**, SOLO el `.sh` (scope: `{"allowed":["templates/fortress-orchestrator.sh"]}`); 18 turnos, $2.19; huella `4b8e3882` |
| GATE verde | 08:43:03 | 4/4 (npm ci, typecheck, lint, test:unit) en **483 s** — dicho por lo que es: el gate NO ejercita `.sh` de templates; su verde prueba «no rompí el TS» |
| **OMEGA APROBADO** | 08:44:23 | $1.49, 4 turnos — **sin lazo: a la primera** |
| **FIRMA del operador** | 18:26:41 (hora local 14:26… del operador 18:26−4) | merge `--no-ff` **`5b28aa5`**, hallazgo → MITIGATED |

**Coste total de la reparación: $5.73.**

## 5. El veredicto de OMEGA, literal (los 6 ejes)

`resuelve_el_hallazgo: SI · respeta_scope: SI · respeta_doNotTouch: SI ·
calidad_del_diff: BUENO · riesgo_residual: MENOR · veredicto_global: APROBADO`

> «Valida los cuatro campos (name, path, remote, branch) en el único punto que
> escribe líneas de datos, antes del echo de repos.conf, con rechazo
> fallo-cerrado (log_error + exit 1) y sin saneo silencioso — exactamente el
> molde del análisis y la doctrina del fichero; `[[:cntrl:]]` cubre saltos de
> línea. `repo_trusted`, la puerta del scan, `cmd_trust` y el formato de
> repos.conf quedan intactos. Residual menor: el mensaje de rechazo pasa
> `printf %q` por `echo -e` (log_error), que puede re-interpretar `\E` …solo
> en la ruta de error; y las líneas forjadas preexistentes en repos.conf no se
> revalidan al leer.»

El residual quedó anotado como seguimiento opcional (endurecer el LECTOR,
defensa en profundidad); no bloqueó la firma y el operador lo leyó antes de
firmar, junto al diff completo (cuaderno de lupa de la sesión).

## 6. Lo que este estreno NO cambió (las redes, intactas)

- **CRITICAL jamás auto-merge**: la política siguió en `['LOW','MEDIUM']`; la
  única puerta fue la firma del operador, con lectura del diff — la red real
  donde el gate era ciego.
- **El Motor siguió solo sobre FORTRESS** (ADR-107) y **no tocó su jaula**:
  cero propuestas sobre `AUTONOMY_RULES_FILES` en toda la jornada.
- La misma cadena que un HIGH, sin rama especial por severidad: ese era el
  diseño, y se midió cumplido.

## 7. Fuentes

- Log crudo del vigía (cada evento con timestamp y evidencia):
  `~/.local/share/vigia-estreno-2026-10-04-08-24.log` (fuera del repo, máquina
  del operador) y el reporte ciclo a ciclo del drenaje en su escritorio.
- Libro de la vida de `2c06d8b5` en la base (eventos #1–#15) y merge `5b28aa5`.
- La maratón completa del día: `docs/HISTORY.md` («La maratón del Motor») y
  `docs/CHANGELOG.md` (2026-10-04/05).

## Referencias

- **ADR-106** (+ enmienda firmada): la escalera y su última puerta.
- **ADR-107**: el perímetro que hizo seguro el estreno.
- **ADR-102 / ADR-110 / ADR-111 / ADR-112**: las piezas que la jornada ejercitó en vivo.
