# ADR-080: La severidad se deriva de tres ejes de vocabulario cerrado — el escáner reporta hechos, FORTRESS decide la banda

- **Fecha:** 2026-09-07
- **Estado:** Aceptada
- **Área:** Escaneo · Severidad · Score

## Contexto

**CRITICAL es alcanzable en el código y nunca aparece en la base.** El primer
commit del escáner real (`9ff562d`, 2026-08-02) lo verificó sobre un proyecto
vulnerable sintético en `/tmp`: encontró la SQL injection, la marcó CRITICAL,
puntuó 64 y bloqueó el push. Desde entonces, sobre los dos proyectos reales,
**0 de 208 hallazgos** (medido el 2026-09-07 en solo lectura: 93 en
`fortress-command-center`, 115 en `mailbd-main`, EXTINCT incluidos; HIGH=24,
MEDIUM=74, LOW=110, CRITICAL=0).

La razón está en cuánto sabe el modelo sobre la escala: **una frase**. Toda la
definición de CRITICAL es `src/domain/scan/scan-checklist.ts:23`:

> `- CRITICAL es solo lo explotable tal y como esta el codigo hoy.`

No hay definición de HIGH, MEDIUM ni LOW en ningún sitio de `src/`. El
contrato (`src/domain/scan/report-contract.ts:15`) fija el vocabulario —*"severity:
exactamente CRITICAL, HIGH, MEDIUM o LOW"*— y su único ejemplo (`:11`) es un
CRITICAL de *"API key hardcodeada"*, que ni siquiera cumple la frase de arriba.
No hay ejemplos por banda, ni impacto, ni alcanzabilidad, ni qué datos toca. Y
no hay ADR: [ADR-039](adr-039-escaner-score-determinista-push-bloqueado.md)
decide el **efecto** de un CRITICAL —score determinista, techo, veto de push—,
no el **criterio**. La escala es una decisión de producto que vive en una
línea de prompt desde el 2 de agosto.

**Sin criterio escrito, el modelo re-decide la severidad en cada corrida.** La
evidencia limpia está en `mailbd-main`: el mismo relay de correo abierto en
`send-preorder-notification` —*"endpoint anónimo permite enviar correo de marca a
dirección arbitraria"*— fue **MEDIUM** en una corrida y **HIGH** en otra, dos
corridas viendo el mismo hallazgo. El caso del precio manipulable desde una
petición anónima en `create-checkout` aparece como LOW, MEDIUM y HIGH en tres
filas; **no se presenta aquí como una sola fila**, porque mezcla esa re-decisión
con títulos distintos de la era anterior a ADR-067 (98 de las 115 filas de ese
proyecto conservan la identidad vieja). Con una fila limpia basta.

Esto es lo que [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) dejó
abierto a sabiendas. Cerró la **identidad** con un vocabulario cerrado de
tipos y una clave derivada, y dijo de la severidad que *"resultó tan inestable
como el título"* — la diagnosticó y no la cerró. Este ADR la cierra **con el
mismo mecanismo**.

Y hay una tercera cara. FORTRESS distribuye a los proyectos un molde
(`../CLAUDE.md`, el kit universal) cuyo checklist clasifica por categoría:
todo lo de seguridad —secrets, inyección, *"endpoints sin autenticación"*,
*"endpoints sin autorización"*, CORS, path traversal— es **CRITICAL, resolver
inmediatamente**. Su propio escáner usa esas mismas cinco familias como lista
de búsqueda (`scan-checklist.ts:7-15`) y les puso LOW, MEDIUM y HIGH. Ninguno
de los dos tiene razón entera: el molde es demasiado laxo (no distingue quién
alcanza el defecto ni qué se lleva) y el escáner demasiado estricto y sin
criterio. **Lo que falta en medio es la rúbrica**: explotable × alcanzable por
quién × qué toca.

## Decisión

### 1. El escáner no elige la banda: reporta tres ejes

Es el patrón que FORTRESS ya usa con el revisor del motor
([ADR-023](adr-023-seis-ejes-veredicto-recomputado.md)): *"los ejes son
evidencia; la regla es código"* (`src/domain/repair/omega-verdict.ts:21-33`).
El revisor no dice APROBADO o VETADO; dice seis ejes y el motor recomputa. Y ya
lo usa también el escáner de exposición, que deriva CRITICAL o HIGH en código
según la ruta expuesta (`src/domain/posture/analyze/exposed.ts:31`). Aplicado a
los hallazgos de código, cada uno lleva **tres ejes de vocabulario cerrado**,
tan cerrado como los tipos de ADR-067:

| eje | valores | la pregunta que responde |
|---|---|---|
| **alcance** | `anonimo` · `autenticado` · `privilegiado` · `local` | ¿quién llega hasta el defecto? |
| **efecto** | `dinero` · `datos-de-terceros` · `credenciales` · `ejecucion` · `integridad` · `disponibilidad` · `informacion` | ¿qué se lleva o rompe? |
| **estado** | `explotable-hoy` · `requiere-condicion` · `defensa-en-profundidad` | ¿funciona con el código de hoy? |

`explotable-hoy` **es** la frase del 2 de agosto, ahora como valor de un eje y
no como única regla. `requiere-condicion` es un defecto real que exige otra
falla, una configuración concreta o acceso a la red interna para explotarse.
`defensa-en-profundidad` es una capa que falta sin que haya hoy un camino de
explotación: cabeceras, rate limiting, un `error.message` crudo.

### 2. La tabla de derivación

FORTRESS deriva la banda de los tres ejes, en código, en este orden — la
primera fila que cuadra decide:

| estado | alcance | efecto | banda |
|---|---|---|---|
| `defensa-en-profundidad` | cualquiera | cualquiera | **LOW** |
| `requiere-condicion` | cualquiera | cualquiera | **MEDIUM** |
| `explotable-hoy` | `anonimo` o `autenticado` | `dinero` · `datos-de-terceros` · `credenciales` · `ejecucion` | **CRITICAL** |
| `explotable-hoy` | cualquier otra combinación | | **HIGH** |

Los cuatro efectos de la fila CRITICAL son los que **cruzan fuera del perímetro
de quien ataca**: el dinero no es suyo, los datos son de terceros, las
credenciales abren lo que no es suyo, y la ejecución lo es todo. Un
`autenticado` que altera lo **propio** —su carrito, su perfil— produce
`integridad` o `informacion`, no esos cuatro, y cae en HIGH: es la traducción
en ejes de *"autenticado cruzando a datos ajenos"*. Un `privilegiado` o un
`local` con esos mismos efectos es HIGH y no CRITICAL, porque para llegar hace
falta lo que un anónimo no tiene. Un `anonimo` que solo obtiene `informacion`
—versiones, rutas internas, trazas— es HIGH si es explotable hoy y LOW si es
defensa en profundidad; si lo que obtiene son datos de personas, eso es
`datos-de-terceros`, no `informacion`.

### 3. Un ejemplo por banda, de los casos reales de `mailbd-main`

Clasificación esperada de hallazgos que **ya están en la base**, con la banda
que el escáner les puso sin rúbrica:

| hallazgo | ejes esperados | banda derivada | hoy |
|---|---|---|---|
| petición anónima puede mutar el precio del catálogo (`create-checkout`) | `anonimo` · `dinero` · `explotable-hoy` | **CRITICAL** | LOW, MEDIUM y HIGH, en tres filas |
| relay de correo abierto con contenido del atacante a clientes reales (`send-preorder-notification`) | `anonimo` · `datos-de-terceros` · `explotable-hoy` | **CRITICAL** | MEDIUM y HIGH |
| `cart_abandonment` UPDATE alcanzable por cualquier autenticado no admin | `autenticado` · `integridad` · `explotable-hoy` | **HIGH** | HIGH |
| el fallback de precios casa por subcadena y acepta `productId` arbitrario — solo si el catálogo no responde y entra el fallback | `anonimo` · `dinero` · `requiere-condicion` | **MEDIUM** | MEDIUM |
| `error.message` crudo devuelto a un llamador anónimo | `anonimo` · `informacion` · `defensa-en-profundidad` | **LOW** | LOW |

Estos cinco son los fixtures deterministas del cambio que aplica este ADR: la
tabla se prueba **sin modelo**, con los ejes escritos a mano, y el escáner solo
tiene que acertar tres palabras de una lista — una tarea mucho más estrecha que
"elige una severidad".

### 4. Sin ejes no se inventa nada

Si el bloque del hallazgo viene **sin ejes**, o con un valor fuera del
vocabulario, **se conserva la severidad que dijo el modelo** y el hallazgo se
marca `sin-ejes`. Es el mismo sesgo que `aTipoDeDefecto` → `otro`
(`src/domain/scan/tipo-de-defecto.ts:50-55`): fuera del vocabulario no se
adivina. **Nada cae a CRITICAL por accidente**: la única forma de llegar a esa
banda es que los tres ejes lo digan.

### 5. La palabra del modelo se conserva como evidencia

El escáner sigue mandando su propia `severity` junto a los ejes, y se guarda.
Cuando difiere de la banda derivada, la discrepancia **se asienta**, como hace
el motor con el revisor (`emitOmegaMismatch`,
`src/application/repair/run-omega-judge.ts:59-62`): en un mes se podrá medir
cuánto se calibra el modelo contra la tabla, y si un eje se le resiste. Lo que
manda en el tablero, el score y el push es **la derivada**.

## Alternativas descartadas

**Una rúbrica en prosa dentro del prompt.** Más barata —unas líneas en
`scan-checklist.ts`— y mejor que la frase de hoy. Pero el modelo **sigue
eligiendo la banda**: una rúbrica en prosa estrecha la inestabilidad, no la
cura, y la evidencia de este mismo ADR es un modelo que con la misma frase
delante dio dos bandas al mismo hallazgo. La estabilidad exige que el modelo
deje de decidir la banda, igual que ADR-067 exigió que dejara de redactar la
clave.

**Aflojar la frase** ("lo explotable o lo que podría serlo"). Convierte "nunca
CRITICAL" en "demasiados CRITICAL", que es el lado opuesto y no el centro; y
por la cascada de abajo, cada CRITICAL de más es un push vetado y un score con
techo. La cura tiene que ser precisa, no permisiva.

**Confiar en la severidad del modelo y solo medirla.** Es lo que hay hoy, con
un número delante: 0 de 208.

## Consecuencias

- **La cascada de ADR-039 se mantiene entera y no se revisa.** Un CRITICAL
  abierto veta el push (`src/domain/project/push-readiness.ts:17`), pone el
  score bajo el techo 64 (`src/domain/shared/penalty-score.ts:5,19-20`), corta
  el workflow de seguridad tras el paso con puerta
  (`src/application/workflow/run-workflow.ts:65-66`) y deja al loop sin poder
  declararse *resuelto* (`src/domain/loop/loop-decision.ts:31,37-45`). **No es
  un efecto nuevo: es el motivo por el que CRITICAL existe** — el commit
  `9ff562d` lo dice: sin techo, *"un repo con una SQL injection marcaría 75 en
  verde y 'push bloqueado' a la vez"*. Sus dos válvulas ya existen: OMEGA
  verifica cada CRITICAL contra el disco antes de asentar el veto
  (`src/application/omega/record-push-decision.ts:28-37`), y el operador puede
  descartar uno como falso positivo con huella y fecha, lo que desbloquea el
  push (`src/domain/project/finding-status.ts:9-13`).
- **El techo 64 solo muerde por encima de 64.** Si un proyecto ya está por
  debajo, lo que lo mueve es la resta de 25 por CRITICAL
  (`src/domain/scan/score-from-findings.ts:10`), no el techo. Este ADR **no
  anticipa el número** de ningún proyecto: se mide el día del re-escaneo, antes
  y después.
- **Las 208 filas históricas no se reescriben.** No tienen ejes y conservan su
  banda. La derivación aplica hacia adelante, como ADR-067; un hallazgo antiguo
  que el escáner vuelva a nombrar recibe ejes en ese momento y su fila se
  refresca por la vía normal (`syncFromScan` toca, no inserta).
- **La severidad sigue fuera de la identidad** (ADR-067) y **la fusión sigue
  quedándose con la máxima del grupo** ([ADR-071](adr-071-cuando-dos-filas-son-una.md),
  enmienda). Nada cambia ahí.
- **Los ejes llegan también a los agentes del Terminal**: `step-prompt.ts:69-73`
  ya mete `SCAN_RULES` y `REPORT_CONTRACT` en cada paso de un workflow, así que
  los hallazgos de una orden en el Terminal se derivan igual que los de un
  escaneo.
- **Ficheros del cambio** (el commit siguiente): `report-contract.ts` pide los
  ejes; `scan-checklist.ts:23` pasa a definir `explotable-hoy`;
  `detected-finding.ts` los lleva; `parse-scan-output.ts` los lee sin inventar;
  y nace `severidad-derivada.ts` en el dominio con la tabla y sus cinco casos.
  **Ninguno está en la lista innegociable** (verificado contra
  `auto-merge-blacklist.ts` e `innegociables-*.ts`): el cambio no cruza firma
  por esa vía.
- **Verificación empírica al cierre, que corre el operador:** un re-escaneo en
  vivo de `mailbd-main` que confirme que los CRITICAL aparecen donde la tabla
  dice, y una segunda corrida que confirme que **ya no bailan**. Es la única
  prueba que la tabla no puede darse a sí misma.

## Referencias

- [ADR-023](adr-023-seis-ejes-veredicto-recomputado.md) — el patrón: ejes del
  revisor, veredicto recomputado por el motor.
- [ADR-039](adr-039-escaner-score-determinista-push-bloqueado.md) — el efecto
  de un CRITICAL: score determinista, techo y veto de push. Se mantiene.
- [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) — el vocabulario
  cerrado que estabilizó la identidad y dejó la severidad abierta.
- [ADR-071](adr-071-cuando-dos-filas-son-una.md) — la fusión conserva la
  severidad máxima; no cambia.
- [ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md) — el arco
  inmediatamente anterior; su red no revierte por CRITICAL, y sigue sin
  hacerlo.
- [FORTRESS-FUNCIONAMIENTO-ACTUAL](../FORTRESS-FUNCIONAMIENTO-ACTUAL.md) §2.1 y
  §9.2 — el escaneo y "no trabaja HIGH ni CRITICAL en el motor", que tampoco
  cambia.

## Código

`src/domain/scan/report-contract.ts` · `src/domain/scan/scan-checklist.ts` ·
`src/domain/scan/detected-finding.ts` · `src/domain/scan/parse-scan-output.ts` ·
`src/domain/scan/severidad-derivada.ts` (nace con el commit siguiente) ·
`src/domain/shared/penalty-score.ts` · `src/domain/project/push-readiness.ts`
