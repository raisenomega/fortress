# ADR-089: La garantía es la firma humana, no una lista de palabras — muere el freno por palabra del Terminal

- **Fecha:** 2026-09-17
- **Estado:** Aceptada (firmada por el operador el 2026-09-17)
- **Área:** Terminal · Modo efectivo · Seguridad
- **Retira:** la degradación por área protegida (`modo-efectivo.ts:49`)

> ### ⚠ ENMIENDA 1 — 2026-09-19: el freno sobrevivió un mes EN EL PROMPT
>
> **Este ADR retiró el freno del CÓDIGO y dejó la misma orden escrita en el
> prompt**, en `operation-mode.ts`, el propio fichero que estaba limpiando. El
> mecanismo murió; la instrucción al modelo no. **Lo completa la §8**, escrita al
> cerrar el punto 5 de la Fase B (ADR-097).

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

**Fase 2 — Traer al Terminal las capas que el Motor ya tiene.** No es solo
enganchar OMEGA. La lectura dejó claro que el Motor se defiende con **tres**
capas que el Terminal no tiene, y la Fase 2 las evalúa **una por una**:

- **(a) OMEGA revisa el diff con evidencia.** Se trae. Es el revisor que hoy
  falta y el que cierra el hueco del intervalo.
- **(b) La correa de alcance.** Se **evalúa**: en el Motor limita qué ficheros
  puede tocar el generador (`checkScope`, `allowed-files`, los grupos del repo
  auditado). En el Terminal no existe. Hay que decidir si un productor que
  resuelve un hallazgo de `vercel.json` debe poder tocar cualquier fichero del
  proyecto, o solo el terreno del hallazgo. Tiene tensión con la doctrina —una
  correa es otro tapón— pero no es lo mismo: limita el **alcance** del cambio,
  no **si el modelo puede pensar** en seguridad. La decisión se toma en la
  Fase 2, con su lectura.
- **(c) El worktree aislado.** Queda **fuera de alcance por diseño**. El
  Terminal edita el árbol del cliente a propósito: ese es su producto —el
  operador ve los cambios en su repo y los integra con su git—. Aislarlo lo
  convertiría en el Motor, que es otra herramienta. Aquí la red es git + la
  firma humana.

La Fase 2 **documentará cuál de estas capas se trae y cuál no, y por qué**. Lo
que este ADR NO decide es que el Terminal se quede sin ellas para siempre: la
Fase 1 abre un intervalo con menos capas, y la Fase 2 decide cuáles se cierran.

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

**El intervalo NO es «donde el Motor ya vive», y conviene no contárselo así.**
El Motor trabaja sin humano delante, sí, pero con **tres** capas que el Terminal
no tendrá en la Fase 1: worktree aislado (no toca el árbol vivo), correa de
alcance (limita qué ficheros puede tocar) y OMEGA. El Terminal en el intervalo
edita el árbol de trabajo del operador, sin correa y sin revisor. Lo compensa
con la firma humana y con git —y por eso la doctrina se sostiene— pero es
**menos capas con un humano encima**, no lo mismo probado en otro sitio.

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

**Decidido: `protected-areas.ts` se BORRA en la Fase 1.**

No solo porque CLAUDE.md mande eliminar código muerto. La razón de fondo es que
ese fichero **es la prueba del delito**: nació sin decisión escrita y creció
hasta contradecir el propósito del producto. Conservarlo sin uso deja **la misma
condición que lo hizo posible** — código sin decisión detrás, esperando que
alguien lo reconecte «porque ya estaba». El repo tiene esa cicatriz escrita en
`innegociables-defensa.ts`: *«la lista sigue al fichero y la defensa se mudó»*.
Un fichero fantasma con una lista de palabras de seguridad es exactamente lo que
un día alguien vuelve a enchufar.

Si algún día se quiere **marcar** un hallazgo como sensible sin degradar por
ello, será una decisión nueva con su propio ADR, no un fichero esperando en la
oscuridad.

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

---

## §8 — ENMIENDA 1 (2026-09-19): la mitad que faltaba — el freno vivía en el prompt

### 8.1 Lo medido

Este ADR se firmó el 17-sep. El 19-sep, midiendo el punto 5 de la Fase B («el
autónomo deja de comportarse como supervisado»), se encontró esto en
`operation-mode.ts`, **el mismo fichero cuyo freno este ADR retiró**:

```ts
autonomo:
  'MODO AUTONOMO: aplica los cambios y reporta resultados. Corre los tests antes '
  'y despues. Si algo falla, revierte. NUNCA toques auth, payments, RLS ni '
  'seguridad sin volver a supervisado.'
```

**Es la lista de palabras de la §48 de este ADR** — `auth`, `payments`, `RLS`,
`seguridad` — **viva y operando**. No la ejecutaba `effectiveMode`: la ejecutaba
**el modelo**, porque se lo pedíamos en cada turno.

Se verificó que el código estaba limpio de verdad: cero coincidencias de lista de
palabras en `domain/settings/` y `domain/chat/`, y `operation-mode.test.ts:28-33`
ya decía *«estos tests probaban lo contrario y ahora prueban que no»*.

**El mecanismo se borró. La orden se quedó.** Y llegaba al agente por **tres**
puertas, en **todos** los turnos: `chat-prompt.ts:33`, `system-prompt.ts:58`,
`step-prompt.ts:57`.

### 8.2 Por qué es grave, y por qué es el punto 5

1. **«sin volver a supervisado» le pide al agente rebotar la decisión a un humano
   que en autónomo NO ESTÁ.** Es, con esas palabras, el autónomo comportándose
   como supervisado — escrito en el prompt.
2. **El guardián no estaba pintado: estaba SUBCONTRATADO.** Retirar el mecanismo
   y dejar la instrucción es la forma más difícil de cazar un freno, porque no
   aparece en ninguna lectura del código de control.
3. **«NUNCA toques seguridad» a una herramienta cuyos hallazgos SON de
   seguridad** es exactamente el argumento con el que la §252-254 de este ADR
   rechazó *«afinar la lista en vez de retirarla»*. Y es un freno disfrazado, que
   ADR-090 §0 prohíbe.

### 8.3 La decisión

**Se retiran las dos frases.** Queda: *«MODO AUTONOMO: aplica los cambios y
reporta resultados. Corre los tests antes y despues.»* — dice qué hacer, no
prohíbe por palabra.

Y se retira también **«Si algo falla, revierte»**: la reversión es
`conRedDeReversion` (ADR-079), un checkpoint por intento, abajo, donde no se
puede esquivar. Pedírsela al agente duplica una garantía existente, y un agente
que revierte a mano puede deshacer justo lo que la red iba a conservar.

`MODE_INSTRUCTION` sale a `instruccion-de-modo.ts` —el fichero pasaba de 75— con
las dos razones escritas en su docblock, y `instruccion-de-modo.test.ts` prueba
la **ausencia**, con el mismo molde que usó `operation-mode.test.ts` cuando este
ADR retiró el mecanismo.

### 8.4 La lección, que es la que vale para el próximo

> **Retirar un freno del código no lo retira del producto si el prompt sigue
> pidiéndolo.** Un ADR que elimina un mecanismo tiene que buscar la misma regla
> escrita en prosa — en los prompts, en las cartas de los agentes, en los
> docblocks que el modelo no lee pero el humano sí. Aquí sobrevivió un mes, a
> tres puertas de distancia, dentro del fichero que el ADR estaba limpiando.

### 8.5 Deuda medida al cerrar el punto 5 (NO se resuelve aquí)

`esAutonomoDeVerdad` lee la BASE, así que el juicio del plan (ADR-097 §3) corre y
**aprueba el lote** aunque el turno vaya a degradar después por una de las tres
razones estructurales (`modo-efectivo.ts:57-62`: repo propio, sin confianza, sin
red git). Los turnos del lote descubren la degradación **después**, y no editan.

**No es un fallo de seguridad** —la degradación es deliberada y el aviso la
explica—: es **gasto antes de que la degradación sea descubrible**, una corrida
de OMEGA que se sabía de antemano que no iba a servir. Queda anotada.
