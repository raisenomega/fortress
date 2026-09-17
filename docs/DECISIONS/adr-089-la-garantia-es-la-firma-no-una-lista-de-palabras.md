# ADR-089: La garantía es la firma humana, no una lista de palabras — muere el freno por palabra del Terminal

- **Fecha:** 2026-09-17
- **Estado:** Propuesta (pendiente de firma del operador)
- **Área:** Terminal · Modo efectivo · Seguridad
- **Retira:** la degradación por área protegida (`modo-efectivo.ts:49`)

> **El freno que este ADR retira nunca tuvo ADR propio.** Se buscó: ninguna
> decisión de `docs/DECISIONS/` documenta `PROTECTED_WORDS` ni la degradación
> por palabra. Nació como decisión de código, sin quedar escrita ni razonada en
> ningún sitio — y por eso pudo crecer hasta contradecir el propósito del
> producto sin que nadie lo revisara. Esto lo cierra por los dos lados: se
> retira, y la razón queda escrita.

## Alcance

**Este ADR decide SOLO sobre el freno de palabras del Terminal** —
`isProtectedArea` / `PROTECTED_WORDS` — y sobre qué garantía lo sustituye.

Queda **fuera de alcance, explícitamente**:

- **Las otras tres degradaciones de `effectiveMode`**: repo propio, falta de
  confianza y falta de red git. Las tres son garantías **estructurales**, no
  listas de palabras, y **siguen intactas**. Un proyecto sin confianza sigue sin
  ejecutar código ajeno; el repo propio sigue pasando por el Motor; sin red de
  reversión no se escribe (ADR-079, reforzado ayer).
- **El Motor de reparación.** No usa el freno hoy y no se toca aquí.
- **El modo supervisado.** Como se documenta abajo, el freno **nunca** actuó ahí.
- **La lista de innegociables y la correa del generador.** Intactas.

## Contexto

### Lo que se midió

El freno se descubrió por un fallo real, no por teoría. El 17-sep, un turno de
la cola del lote sobre `raisen-nucleo` —proyecto de confianza, git sano, red
disponible— pidió correr en `autonomo` y **corrió en `supervisado`**. El
hallazgo era:

> «Falta la cabecera **Content-Security-Policy** en vercel.json:7»

`isProtectedArea` hace `includes('security')`, y `Content-Security-Policy`
contiene `security`. El productor no pudo editar, el ciclo no cerró, y el
hallazgo siguió vivo con el fichero sin arreglar.

**No es un caso raro: es estructural.** FORTRESS es una herramienta de
seguridad. Sus hallazgos dicen «seguridad», «security», «token», «clave»,
«cifrado», «password», «sesión», «permiso». Con esta lista, **la mayoría de los
hallazgos que FORTRESS encuentra degradan**, y el lote —construido para
resolverlos en tanda— queda inútil justo en lo que más importa.

### Lo que la lectura reveló, y cambia el juicio

El freno es **minúsculo y está en un solo sitio**:

| | |
|---|---|
| llamadores de `isProtectedArea` | **1** — `modo-efectivo.ts:49` |
| llamadores de `effectiveMode` | **1** — `modo-del-turno.ts:31` |
| caminos afectados | **solo el Terminal** (chat libre, resolver en fila, cola del lote) |
| el Motor | **nunca lo usó** |

Y ahí está el argumento que decide este ADR: **el Motor —el único camino donde
un agente trabaja sin humano delante— nunca tuvo freno de palabras.** Se
defiende con correa de alcance, gate objetivo en worktree aislado, y OMEGA
revisando el diff con evidencia. Funciona, y lleva meses funcionando.

El freno de palabras vive **solo** en el Terminal, que es precisamente donde
**sí** hay firma humana: el operador elige el modo y firmó la confianza del
proyecto. Es decir: la lista de palabras protege el camino que más garantías
tiene, y no protege el que menos.

Retirarla **no añade un riesgo nuevo**. Iguala el Terminal al Motor.

### La doctrina del operador

Fijada en la sesión del 17-sep, y es lo que este ADR graba:

1. **FORTRESS resuelve, no solo avisa.** No es un antivirus que señala; es una
   herramienta que arregla. Si no resuelve, no cumple aquello para lo que fue
   construida, y el operador acaba haciendo copy-paste de un chat a un terminal.
2. **`claude -p` ya trae el criterio de seguridad de Anthropic.** El modelo sabe
   para qué fue construido y qué no debe hacer. Un freno de palabras encima
   desconfía de un criterio que ya está blindado en el modelo.
3. **La garantía es la firma humana**, no una lista: modo autónomo elegido por el
   operador + proyecto marcado de confianza por el operador. Esa firma manda.
4. **La red real es activa, no un tapón**: el productor edita con plenas
   capacidades; el gate comprueba; git revierte; OMEGA revisará el diff.

## Decisión

### 1. El freno de palabras se retira

`isProtectedArea` deja de participar en `effectiveMode`. En **autónomo +
confianza**, el productor del Terminal edita con **plenas capacidades, incluida
seguridad** — paridad con `claude -p`.

`effectiveMode` seguirá degradando por las tres razones estructurales: repo
propio, falta de confianza, falta de red git.

### 2. En supervisado no cambia nada, porque el freno nunca actuó ahí

`modo-efectivo.ts:46` corta antes: `if (pedido.mode !== 'autonomo') return
pedido.mode`. El freno **solo se evalúa cuando se pide autónomo**. En
supervisado el humano aprueba cada envío y ninguna palabra degradó nunca nada.
Se documenta para que no vuelva a discutirse.

### 3. Las fases, y el orden

**Fase 1 — Retirar el freno.** Una condición de un `||`. Libera el Terminal de
inmediato.

**Fase 2 — Enganchar OMEGA al Terminal.** El revisor del diff, hoy solo en el
Motor.

**Fase 3 — El debate para lo crítico.** Varias rondas cuando el riesgo lo pide
(ADR-088, Enmienda 1).

Se elige el **orden directo** —Fase 1 antes que Fase 2— y no el conservador,
por coherencia con la doctrina: la garantía real (firma + criterio del modelo +
gate + git) **ya existe** hoy; OMEGA **refuerza**, no habilita. Bloquear la
Fase 1 hasta tener OMEGA dejaría el lote inútil durante todo el trabajo de la
Fase 2, que no es pequeño (ver más abajo).

### 4. Qué es exactamente la garantía en el intervalo — dicho sin adornos

Entre la Fase 1 y la Fase 2, un turno del Terminal en autónomo+confianza está
respaldado por:

| capa | qué cubre | límite conocido |
|---|---|---|
| **Firma humana** | el operador eligió autónomo y firmó la confianza del proyecto | es una decisión previa, no una revisión del diff |
| **Criterio del modelo** | `claude -p` con el blindaje de Anthropic | no es auditable desde FORTRESS |
| **Gate** (`verificarArbol`) | el árbol compila tras editar | **si el proyecto no tiene script `typecheck`, se da por bueno** (`build-verify.ts:29`) |
| **Git** (ADR-079) | revierte si el turno falla o el gate sale rojo | no juzga un cambio que compila pero es malo |

**El hueco que esto deja, escrito para que la firma sea informada:** en un
proyecto **sin** script de verificación, la garantía del intervalo es **firma +
git**, no «firma + gate + git». Medido: de los siete proyectos registrados,
`raisen-nucleo` y `fortress-command-center` tienen `typecheck`; Health Flow no
(su script se llama `type-check`).

Y en cualquier proyecto, git revierte lo que **falla**, no lo que **compila y
es malo**. Ese es exactamente el hueco que la Fase 2 viene a cerrar.

El operador acepta este intervalo a sabiendas. Queda firmado, no implícito.

### 5. Lo que la Fase 2 tendrá que resolver (y no es trivial)

OMEGA recibe hoy `{ analysis, corpus, diffText, filesPre, filesPost }`:

- **El diff del Terminal existe pero nadie lo lee.** Tras `conservar()`, el WIP
  del operador queda stageado y **lo que el agente editó queda sin stagear**:
  `git diff` es exactamente su trabajo (`checkpoint-transitorio.ts:45`). Falta
  el puerto, no el dato.
- **`filesPre` / `filesPost`** son alcanzables: el «antes» en el commit del
  checkpoint, el «después» en el árbol.
- **`analysis` es el hueco real.** OMEGA espera el contrato estructurado del
  Motor (`whatToChange`, `where`, `patternToCopy`, `doNotTouch`, `risk`) y el
  Terminal produce **un plan en prosa**. O se construye ese puente desde el
  hallazgo + el plan, o OMEGA necesita una entrada alternativa para el Terminal.

Esa decisión **no se toma aquí**: es de la Fase 2 y tendrá su propia lectura.

## Consecuencias

**A favor**

- El lote resuelve hallazgos de seguridad, que son la mayoría de los que
  FORTRESS encuentra. La herramienta hace aquello para lo que existe.
- El Terminal queda al nivel del Motor en autonomía, con **más** garantía que
  él (firma humana encima).
- Un freno menos que mantener, y una lista de palabras menos que se queda corta
  en silencio (`security` casaba con `Content-Security-Policy`; nadie lo vio
  hasta que rompió el ciclo).

**En contra, y asumido**

- Durante el intervalo Fase 1 → Fase 2 no hay revisor del diff en el Terminal.
- En proyectos sin script de verificación, el gate no comprueba nada.
- Un cambio que compila y es malo se conserva hasta que OMEGA exista.

**Qué hay que reescribir** (todo son contratos de test, nada de producción):

| sitio | qué asume hoy |
|---|---|
| `operation-mode.test.ts:27-47` | que `auth`, `RLS`, `payments`, `seguridad`, `token`… degradan |
| `terminal-puede-resolver.test.ts:35` | que un texto neutro no es área protegida |
| `auto-merge-blacklist.ts:11` | lista `protected-areas.ts`, solo si el fichero se borra |

## Las líneas que este ADR autoriza tocar

Cambiar un innegociable exige que la firma sea informada de **qué** cambia:

| fichero | línea | cambio |
|---|---|---|
| `src/domain/settings/modo-efectivo.ts` | 4 | retirar `import { isProtectedArea }` |
| `src/domain/settings/modo-efectivo.ts` | **49** | retirar `isProtectedArea(pedido.request) \|\|` |
| `src/domain/settings/protected-areas.ts` | — | queda sin uso |
| `src/domain/settings/operation-mode.ts` | 19 | la re-exportación, si se borra |
| `src/domain/repair/auto-merge-blacklist.ts` | 11 | solo si se borra |

Tras el cambio, `effectiveMode` degrada por: **repo propio**, **falta de
confianza**, **falta de red git**. Ninguna es una lista de palabras.

**Decisión pendiente para la Fase 1:** si `protected-areas.ts` se **borra** o se
**conserva sin uso**. Conservarlo deja código muerto, que el propio CLAUDE.md
manda eliminar; borrarlo pierde la lista por si algún día se quiere para otra
cosa (marcar un hallazgo como sensible, por ejemplo, sin degradar por ello). Se
decide al construir.

## Alternativas descartadas

**Afinar la lista en vez de retirarla.** Excluir `Content-Security-Policy` como
falso positivo. Se descarta: el problema no es *esa* palabra, es que FORTRESS
encuentra hallazgos de seguridad por definición. Afinar la lista sería jugar al
gato y al ratón contra el propio dominio del producto.

**Sacar el título del hallazgo del texto que se juzga.** Hoy `textoParaElModo`
mete `prompt + file + title + tipo` a propósito: un «resuélvelo» neutro no puede
esconder un hallazgo de auth (ADR-088, pieza 2). Revertirlo reabre ese agujero
sin resolver el de fondo.

**OMEGA primero (orden conservador).** Coherente y más seguro, pero deja el lote
inútil durante todo el trabajo de la Fase 2, cuyo puente `analysis` no es
trivial. Se descarta por el coste de oportunidad, con el hueco declarado arriba.

## Referencias

- ADR-079 — la red de reversión: sin checkpoint no se escribe.
- ADR-088 — el Terminal grado bancario; Enmienda 1 (OMEGA y la escala por
  riesgo), Enmienda 3 (OMEGA = Opus 5, independencia estructural).
- `modo-efectivo.ts`, `protected-areas.ts`, `modo-del-turno.ts` — el freno.
- `omega-prompt.ts`, `run-omega-inputs.ts` — lo que OMEGA necesita para juzgar.
