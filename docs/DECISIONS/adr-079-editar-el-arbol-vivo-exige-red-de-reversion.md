# ADR-079: Editar el árbol vivo exige red de reversión — checkpoint transitorio, por turno, y sin git se degrada

- **Fecha:** 2026-09-07
- **Estado:** Aceptada
- **Área:** Terminal · Construir · Seguridad del árbol de trabajo

## Contexto

FORTRESS tiene **dos superficies que editan el árbol vivo** de un proyecto —la
carpeta real del operador, no un worktree— y solo una de ellas tiene red.

**El Terminal** (`view='chat'`) en modo autónomo sobre un proyecto de confianza
lanza el CLI con `acceptEdits` y `cwd` en la carpeta del proyecto
(`src/domain/settings/permission-mode.ts:25-27`;
`src/application/workflow/run-step.ts:23-31`;
`src/infrastructure/claude-code/claude-code-agent.ts:64-66`). Lo hace por los
dos caminos —el workflow que dispara una orden y la conversación de una
pregunta libre (`src/application/chat/reply-from-chat.ts:25-40`)—, porque el
enrutado decide *workflow o conversación*, no *leer o escribir*. Alrededor de
esa edición **no hay checkpoint, ni verificación posterior, ni reversión**: en
`src/application/chat` y `src/application/workflow` no existe ninguna de las
tres palabras. La instrucción *"Corre los tests antes y después. Si algo falla,
revierte"* es texto del prompt (`src/domain/settings/operation-mode.ts:42-45`),
no un mecanismo.

**Construir** (`view='construir'`, modo Ejecutor) edita el mismo tipo de árbol
y **sí** tiene red: checkpoint git antes, revert si el agente falla, `typecheck`
después y revert si queda en rojo (`src/application/build/build-feature.ts:38-60`;
`src/infrastructure/build/run-build.ts:26-30`). Pero esa red **no tiene ADR**:
ningún documento de esta carpeta nombra a Construir ni al Ejecutor. Vive en el
código y en una página de docs, y nada dice por qué existe ni qué la gobierna.

El daño real, medido en el inventario del 2026-09-07: el agente del Terminal no
puede commitear —su allowlist es lectura del grafo más `Bash(npm run
<typecheck|lint|test>)` exactos (`src/infrastructure/claude-code/build-allowed-tools.ts:22-23`;
`src/domain/settings/safe-commands.ts:34-41`)—, así que sus ediciones quedan como
cambios sin commitear. Eso es **recuperable con git a mano** si los ficheros
estaban limpios, y **sin vuelta** en los otros dos casos: cuando el agente pisa
trabajo sin guardar del operador, porque no hay checkpoint previo, y cuando el
proyecto no tiene git o la carpeta no es la raíz de su repositorio. Agrava que
en el camino de workflow la lista de ficheros editados se tira
(`src/application/chat/reply-from-workflow.ts:63`, `edits: []`): la Actividad
no registra ni una edición y el operador no sabe qué se tocó salvo que corra
`git status`.

**Por qué [ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md) no
cubre esto.** Aquel ADR dice que el loop autónomo no necesita red de git — *"ni
respaldo previo, ni comprobación posterior, ni reversión"* — y tiene razón por
un motivo concreto: *"un arreglo que rompe algo no llega a salir de su copia
aislada"*. El argumento entero descansa en el **worktree**. El Terminal no tiene
worktree; edita el árbol vivo. La premisa que hace innecesaria la red allí es
exactamente la que falta aquí.
[ADR-040](adr-040-modo-supervisado-autonomo-degradacion.md) gobierna el modo
autónomo y su degradación por petición, y no dice una palabra sobre revertir.
[ADR-049](adr-049-loop-autonomo-pre-motor.md) es el origen de `gitSnapshot` y
`gitRevert` —el loop pre-motor *"opera sobre el árbol vivo con red git"*—; ese
loop ya no existe, pero su red sobrevivió en Construir sin que nadie la volviera
a decidir.

Se descartó a propósito **quitarle al Terminal la capacidad de editar** y mandar
toda escritura al motor, como ya ocurre con el repo propio
(`SELF_REPO_SUPERVISED`). Es la opción más pequeña en código y la más grande en
producto: el Terminal existe para actuar sobre el proyecto activo
(`docs/PAGES/terminal.md`), y cambiar eso es cambiar para qué sirve, no cómo se
protege.

## Decisión

### 1. Todo camino que edite el árbol vivo exige red de reversión

La regla es sobre el **árbol**, no sobre la superficie: se aplica a cualquier
código que lance un agente con permiso de escritura y `cwd` en la carpeta real
del proyecto. Hoy son dos —el Terminal en autónomo y el Ejecutor de Construir— y
este ADR cubre a los dos. Lo que edita dentro de un worktree (el motor,
[ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md)) queda fuera,
porque su copia aislada es su red.

### 2. La red es un checkpoint transitorio, no un commit permanente ni un stash

Antes de editar: `git add -A` y `git commit --allow-empty --no-verify`, como
hace `gitSnapshot` hoy (`src/infrastructure/loop/loop-git.ts:29-38`). Al terminar
el turno, **en éxito o en fallo**, `git reset --soft <sha^>`: el commit sale del
historial y el árbol de trabajo queda **byte-exacto** — el trabajo del operador
más las ediciones del agente si fue bien; solo el trabajo del operador si se
revirtió.

Las dos alternativas obvias se descartan por razones distintas:

- El **commit permanente** que Construir usa hoy restaura exacto —untracked
  incluidos— pero deja un `checkpoint` en la rama del operador con su trabajo a
  medias dentro, y en el Terminal eso sería un commit por cada mensaje. Y
  `--no-verify` salta sus hooks para dejarlo.
- El **stash** no ensucia el historial, pero el `stash pop` final puede entrar
  en **conflicto** cuando el agente tocó el mismo fichero en el que el operador
  tenía cambios sin guardar. Un árbol en conflicto es peor que el problema que
  se venía a arreglar, y falla justo en el caso que importa.

El checkpoint transitorio tiene un efecto lateral que se acepta y se escribe:
lo que el operador tenía **a medio stagear queda stageado**. El contenido de
cada fichero es idéntico; lo que cambia es el índice. Es un precio menor por
una restauración que no puede conflictuar.

### 3. La unidad es el turno completo

Un checkpoint antes de producir la respuesta y una decisión después, en el
único punto por el que pasan los dos caminos del Terminal
(`src/application/chat/send-message.ts:52-58`). No por paso: un workflow son
varios agentes seguidos y los pasos posteriores dependen de las ediciones de
los anteriores; revertir uno a uno exigiría un checkpoint por agente y dejaría
el árbol en un estado intermedio que ningún paso vio entero.

### 4. Qué dispara la reversión, y qué no

Revierte:

- `outcome.failed` — algún paso falló (`src/application/chat/reply-from-workflow.ts:60`).
- La **verificación** en rojo tras el turno, con la misma `typecheck` que
  Construir (`src/infrastructure/loop/loop-verify.ts:24-30`).
- **Detener.** El botón mata al hijo con escalada a SIGKILL
  (`src/infrastructure/ipc/chat-send-handler.ts:39-46`), y un agente muerto a
  media edición es el peor estado posible del árbol. La doctrina de que *una
  parada humana no es un fallo* habla de cómo se **anota** una corrida, no de
  dejar ficheros a medias.

No revierte:

- El **paro por CRITICAL** de un paso con puerta
  (`src/application/workflow/run-workflow.ts:65-66`). Es seguridad funcionando,
  y ya viaja separado en el dato: como `stoppedBy`, no como `failed`. No hay que
  distinguirlo; solo no confundirlo.

### 5. Sin git, o sin raíz, el Terminal degrada a supervisado

Si la carpeta del proyecto no es la **raíz de su propio repositorio** —o no es un
repositorio—, no hay red posible, y **no se edita**. Pero el Terminal no devuelve
un error a cada mensaje: **degrada a supervisado con aviso**, que es lo que ya
hace ante el repo propio, un área protegida o la falta de confianza
(`src/domain/settings/modo-efectivo.ts:36-41`). Se sigue preguntando y
analizando; lo que no ocurre es escribir sin poder deshacer.

La regla "sin raíz de repo, no" no es nueva: la aplica `gitSnapshot`
(`loop-git.ts:12-15`, *"un `add -A` / `reset --hard` ahí podría destruir trabajo
ajeno"*) y la aplica el push (`src/infrastructure/ipc/push-handlers.ts:12-24`,
*"el push publicaría el repo padre"*). Esta es su tercera aplicación de la misma
verdad.

La condición **vive en `effectiveMode`**, no en el caso de uso que la
consulta. `modo-efectivo.ts` está en la lista innegociable
(`src/domain/repair/auto-merge-blacklist.ts:13`), así que ese cambio **cruza
firma humana** — y es lo correcto: *cuándo degrada el autónomo* tiene que
seguir en un solo sitio ([ADR-059](adr-059-capas-de-estado-no-heredan.md)), y
esa lista existe precisamente para que un cambio en esa pregunta se vea.
Ponerla en `send-message.ts` para esquivar la firma dejaría la misma decisión
repartida en dos ficheros.

## Consecuencias

- Nace `checkpoint-transitorio` junto a `gitSnapshot` y `gitRevert`, con pruebas
  sobre repositorios temporales reales: el mecanismo es git, y contra un doble
  no se probaría nada. **Construir no se toca** en este arco: sigue con su commit
  permanente hasta que el operador decida, aparte, si migra al transitorio.
  Este ADR ya lo gobierna en ambos casos.
- `effectiveMode` gana una cuarta condición de degradación —hay red git— y ese
  commit lleva firma humana por estar en la lista innegociable.
- El envoltorio del Terminal se pone alrededor de `produceReply`, solo en
  autónomo y solo con el motor CLI: en supervisado el CLI corre en `plan` y no
  hay nada que revertir, y pagar un checkpoint por cada pregunta sería ruido.
  Cuando revierte, lo dice en el texto de la respuesta, como Construir.
- La lista de ediciones del camino de workflow **deja de tirarse**: la Actividad
  registra qué ficheros se tocaron, con red o sin ella.
- Cierra la deuda `terminal-autonomo-edita-sin-red-de-reversion` y, de paso, da
  a Construir el ADR que no tenía. La reubicación de `loop-git.ts` y
  `loop-verify.ts` bajo `build/` —hoy solo los importa el Ejecutor— es la deuda
  `loop-git-y-loop-verify-son-de-build`, y conviene hacerla en el mismo arco.
- Lo que este ADR **no** decide: si el checkpoint transitorio debe sustituir al
  permanente en Construir. Es una decisión del operador y se toma sola, con su
  medida delante.

## Referencias

- [ADR-040](adr-040-modo-supervisado-autonomo-degradacion.md) — el modo
  autónomo y su degradación por petición.
- [ADR-044](adr-044-workspace-trust-por-proyecto.md) — la confianza como
  condición para ejecutar código del repo.
- [ADR-049](adr-049-loop-autonomo-pre-motor.md) — el origen de la red git de
  checkpoint/revert.
- [ADR-059](adr-059-capas-de-estado-no-heredan.md) — una sola verdad por
  decisión.
- [ADR-061](adr-061-modo-autonomo-con-la-disciplina-del-motor.md) — por qué el
  motor no necesita red: el worktree.
- [FORTRESS-FUNCIONAMIENTO-ACTUAL](../FORTRESS-FUNCIONAMIENTO-ACTUAL.md) §2.2 —
  el camino del Terminal, con sus dos spawns.

## Código

`src/application/chat/send-message.ts` · `src/application/chat/reply-from-workflow.ts` ·
`src/application/workflow/run-workflow.ts` · `src/domain/settings/modo-efectivo.ts` ·
`src/application/build/build-feature.ts` · `src/infrastructure/loop/loop-git.ts` ·
`src/infrastructure/loop/loop-verify.ts`
