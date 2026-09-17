# ADR-090 — El Terminal autónomo juzga, debate y reintenta sin parar

- **Estado**: Aceptada
- **Fecha**: 2026-09-17
- **Alcance**: Terminal (modo autónomo) — Arco 5 de ADR-088, la Pieza 5
- **Relación con ADR-088**: completa el arco. Piezas 1–4 instaladas (`304e033`).
- **Enmienda muerta**: la rama `51a822b` («se detiene al primer fallo») queda
  **descartada**. Se registra abajo, en *Alternativas consideradas*, con la razón.

---

## 0. El estándar del operador (innegociable, y es lo primero por algo)

> **FORTRESS no mide cuánto gasta — mide cuán grande, profundo, robusto y
> preciso resuelve.**
>
> Los agentes exploran todo lo que necesiten. **«No dejar explorar para
> abaratar» es un freno disfrazado, y está prohibido.** El Terminal autónomo y
> LOOP se toman el tiempo y el coste que el problema requiera para arreglar de
> verdad.

Esto no es un preámbulo retórico: es la regla que decide los empates de este
ADR y de los que vengan. Cada vez que una decisión de diseño pueda leerse como
«más barato» o «más profundo», gana **más profundo**. Si alguien encuentra en
este documento una frase que contradiga el párrafo de arriba, la frase está mal
y el párrafo manda.

**Cómo se reconoce un freno disfrazado.** Un freno disfrazado es cualquier
mecanismo que reduce la capacidad de resolver y se justifica por una razón que
no es la corrección: coste, tiempo, prudencia genérica, «por si acaso», o la
comodidad de quien lo escribe. Se disfraza porque siempre llega con una razón
que suena responsable. Las tres formas que ya hemos cazado en este proyecto:

1. **Por palabra** — degradar el modo porque la petición contiene «auth» o
   «security». Muerto en [ADR-089](adr-089-la-garantia-es-la-firma-no-una-lista-de-palabras.md).
   Era absurdo: los hallazgos de una herramienta de seguridad son de seguridad
   **por definición**, así que el freno impedía al producto hacer aquello para
   lo que existe.
2. **Por parada** — detenerse al primer fallo en un lote autónomo. Muerto en
   este ADR (§7). Parar y esperar al humano **es supervisado con otro nombre**.
3. **Por bolsillo** — no dejar que un crítico navegue el repositorio para que
   su turno cueste menos. Muerto en este ADR, y lo propuse yo (§6). Es el más
   peligroso de los tres porque viene con una medición que lo respalda.

---

## 1. Contexto

ADR-088 declaró el Terminal «grado bancario». Las piezas 1–4 quitaron el tope de
tiempo, ataron el foco al `findingId`, cerraron el ciclo contra Historia y
fijaron el productor con escalera de modelos y memoria por hallazgo (`--resume`).

Quedaba la Pieza 5, enunciada entonces como «OMEGA revisa el diff». Antes de
escribir una línea de código se hicieron **tres lecturas de solo lectura** del
sistema real. Las tres cambiaron el enunciado de la pieza. Lo que sigue es lo
que se midió, no lo que se suponía.

### Lectura 1 — el juicio ya existe, pero está soldado al Motor

`runOmega` no es una función que juzgue un diff: es un paso de la máquina de
estados del Motor de reparación.

```
src/application/repair/run-omega.ts:50   if (!proposal || proposal.state !== 'GATE') return { ok: false, reason: 'invalid_state' }
src/application/repair/run-omega.ts:51   const events = await ctx.eventLog.list(proposalId)
src/application/repair/run-omega.ts:55   const worktreePath = `${deps.worktreeRoot}/${proposal.id}`
src/application/repair/run-omega.ts:64   if (spent + MIN_OMEGA_BUDGET > MAX_TOKENS_PER_PROPOSAL) return veto('budget_exceeded')
```

Cuatro acoplamientos en quince líneas: exige una `RepairProposal` en estado
`GATE`, exige un `eventLog` por propuesta, exige un worktree con la ruta
derivada del id de la propuesta, y exige un presupuesto por propuesta
(`src/domain/repair/budget.ts:5,9` — 2.000.000 y 300.000 tokens). El Terminal no
tiene ninguna de esas cuatro cosas: edita en el árbol de trabajo real del
proyecto del cliente, bajo el checkpoint transitorio de
[ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md).

Pero el **juicio en sí** —lo que OMEGA hace con lo que recibe— no depende de
nada de eso:

```
src/application/repair/run-omega-inputs.ts:14   * OMEGA no navega: revisa EXACTAMENTE lo que el fix toco. Pre y post de cada
src/application/repair/run-omega-inputs.ts:31   return { input: { analysis, corpus, diffText, filesPost, filesPre }, files }
```

Cinco entradas puras. Ninguna es del Motor. **El juicio se puede reusar; el
envoltorio no.**

### Lectura 2 — la orquestación multi-agente ya existe, y el Terminal la apaga

No hay que inventar el debate entre agentes. Ya está construido:

```
src/application/workflow/run-workflow.ts:47   for (const [index, step] of plan.active.entries()) {
src/application/workflow/run-workflow.ts:61     const result = await runStep(deps, step.agentId, prompt, permissionMode, parseScanOutput)
src/application/workflow/run-workflow.ts:63     previous.push(...summarize(result))
src/application/workflow/run-workflow.ts:66     if (bloquea) return { results, stoppedBy: step.agentId }
src/domain/workflow/workflow-catalog.ts:28       steps: [SECURITY, QUALITY, CLOSING_STEP]
```

Cadenas de agentes que se pasan contexto (`previous.push`). Y el Terminal, en
cuanto hay un hallazgo enfocado, **no entra ahí**:

```
src/application/chat/produce-reply.ts:58   if (foco !== null) {
src/application/chat/produce-reply.ts:59     return replyFromChat({ ...opciones, enFoco: formatearHallazgo(foco), sesion: foco.sesion })
```

Un solo productor, siempre. Esto fue correcto en la Pieza 2 y sigue siéndolo
como **defecto**: resolver un hallazgo es un turno, no un pipeline de revisión,
y disparar el pipeline entero por escribir «arregla … seguridad» era el bug que
la Pieza 2 cerró. Lo que este ADR añade no es deshacer eso: es que **después**
de que el productor proponga, alguien distinto mire.

Hay además un detalle que conviene dejar dicho: los agentes del Motor no son
agentes del catálogo. Se registran con `agentId: null`
(`src/application/repair/record-motor-run.ts:37,44`), y por eso en la medición
del §6 aparecen agrupados bajo `null` (313 ejecuciones).

### Lectura 3 — el dinero está en explorar, no en compartir contexto

Medido sobre **483 ejecuciones reales** de `agent_runs` en la base del operador,
el mismo día de la firma:

| agente             |   n | coste medio | duración | vueltas |
| ------------------ | --: | ----------: | -------: | ------: |
| `security-reviewer`|  81 |       $6.79 |     730s |    55.2 |
| `code-reviewer`    |   5 |       $2.31 |     292s |    38.0 |
| `productor`        |  14 |       $2.15 |     495s |    19.9 |
| `null` (Motor)     | 313 |       $1.34 |     242s |    22.7 |
| `sentinel-omega`   |  56 |       $0.53 |      75s |     8.3 |

Dos hechos, y no dicen lo mismo:

- **Compartir contexto es casi gratis.** Entre el 90% y el 96% del contexto de
  cada turno llega como `cache_read_tokens`. Los `input_tokens` frescos de un
  turno encadenado se cuentan por decenas (medidos: 4 a 578). Pasarle a un
  crítico todo lo que sabe el productor **no es lo caro**.
- **Explorar es lo caro.** La diferencia entre $6.79 y $0.53 es 55.2 vueltas
  contra 8.3. `sentinel-omega` es barato exactamente por la razón que su propio
  código declara: **no navega** (`run-omega-inputs.ts:14`). Recibe el diff
  cocinado y lo juzga.

De aquí salió una propuesta —mía— y su rechazo, que es la parte de este
documento que más importa conservar. Va en §6.

---

## 2. Decisión

**El Terminal en modo autónomo resuelve el lote entero sin llamar al humano ni
una vez**, y para merecer eso incorpora tres cosas que hoy no tiene: juicio
independiente antes de conservar, debate con roles opuestos, y paralelismo por
severidad.

Se implementa en tres fases. Las fases son orden de construcción, no niveles de
ambición: las tres son la decisión.

### Fase A — Reusar el juicio, y juzgar ANTES de conservar

1. **Desacoplar `runOmega`.** Extraer el juicio puro (las cinco entradas de
   `run-omega-inputs.ts:31`) de su envoltorio de Motor. El Motor sigue llamando
   a lo mismo que llama hoy; el Terminal llama al juicio desnudo.
2. **Construir el `analysis` del Terminal.** El Motor lo saca de su `eventLog`.
   El Terminal lo tiene delante: es el hallazgo enfocado más el plan que el
   productor escribió. Hay que darle forma, no inventarlo.
3. **El ciclo del turno autónomo pasa a ser:**

   ```
   editar → gate → OMEGA juzga → conservar | revertir y reintentar
   ```

   hasta converger. **Sin llamar al humano en ningún punto.**

**El orden es la decisión, y no es negociable.** Hoy el turno conserva lo
editado si el gate pasa. El gate dice «compila y los tests verdes»; no dice «el
fix es correcto ni está completo». Un fix que silencia el síntoma pasa el gate.

Esto no es un límite de profundidad: es **secuencia**. El escaneo *lee* —si se
equivoca, el operador descarta un hallazgo. El Terminal autónomo *escribe* en el
proyecto del cliente. Entre escribir y dejarlo escrito debe pasar un juicio que
no sea el de quien escribió. La red de ADR-079 permite revertir; este ADR añade
**quién decide revertir**, y no es el autor del cambio.

El checkpoint transitorio ya está construido para esto:

```
src/infrastructure/git/checkpoint-transitorio.ts:45   * y lo que el agente edito queda SIN stagear — `git diff` es lo que hizo
```

Lo que el agente hizo es exactamente lo que OMEGA necesita recibir. Encaja sin
forzar nada.

### Fase B — Debate con roles opuestos

Un solo modelo revisando su propio trabajo tiende a aprobarlo. La corrección no
sale de mirar dos veces: sale de que **alguien tenga el encargo contrario**.

- **Productor** — propone el fix. Ya existe y está fijado (Pieza 4,
  `src/domain/agent/productor.ts`, `MODELO_DEL_PRODUCTOR` en
  `escalera-de-modelos.ts:32`).
- **Crítico** — su encargo es **encontrar el fallo**, no confirmar el acierto.
  Sale del catálogo (`security-reviewer`, `code-reviewer`, según el hallazgo).
  Se le pasa el contexto del productor —que es casi gratis, §1 lectura 3— y
  **navega el repositorio todo lo que necesite**. Un crítico que no puede leer
  el resto del código no es un crítico: es un corrector de estilo.
- **OMEGA** — juzga entre los dos. Recibe el diff cocinado, como siempre, más lo
  que el crítico encontró. `sentinel-omega.ts:30` lo tiene en `model: 'opus'` y
  ahí se queda.

El mecanismo de encadenar ya existe (`run-workflow.ts:47-63`). Lo que hay que
construir es la cadena para este caso, no la maquinaria.

### Fase C — Paralelo por severidad

- **CRITICAL y HIGH** — varios críticos **a la vez** (`Promise.all`), con
  encargos distintos. El tiempo de pared de un lote no debe crecer linealmente
  con el rigor.
- **MEDIUM y LOW** — un crítico.

La severidad gradúa **cuántas miradas**, nunca **cuánto puede mirar cada una**.
Esa distinción es la frontera entre graduar el esfuerzo y frenarlo.

---

## 3. Topes: fronteras, no frenos

Esto necesita decirse con precisión, porque un tope y un freno se parecen mucho
por fuera y este ADR prohíbe uno mientras conserva el otro.

- Un **freno** limita *cuánto puede explorar* un agente que está trabajando
  bien. Prohibido.
- Una **frontera** detecta que el trabajo *ya no avanza*. Obligatoria.

El ciclo de la Fase A reintenta **hasta converger**, y converger es un juicio
sobre el estado, no un contador de vueltas:

- OMEGA aprueba → **conservar**, cerrar el hallazgo.
- OMEGA rechaza y el siguiente intento ataca algo distinto → **seguir**.
- OMEGA rechaza y el intento repite lo ya rechazado, o el diff no cambia →
  **no hay avance**: revertir, marcar el hallazgo como no resuelto con la razón
  escrita, y **pasar al siguiente**. No se para el lote.

La forma correcta de escribirlo es *«se detecta que no avanza»*, no *«se agotan
los intentos»*. Un contador es un freno con reloj.

El presupuesto por propuesta del Motor (`budget.ts:5,9`) **no cruza** al
Terminal. Es un mecanismo del Motor, para el Motor.

---

## 4. Qué NO cruza del Motor al Terminal

Que el juicio se reuse no significa que se reuse el Motor. Lo que se queda
donde está, y por qué:

| Del Motor                       | ¿Cruza? | Razón |
| ------------------------------- | ------- | ----- |
| El juicio de OMEGA (5 entradas) | **Sí**  | Es puro; no sabe que existe el Motor. |
| Estado `GATE` / `RepairProposal`| No      | El Terminal no tiene propuestas: tiene turnos. |
| `eventLog` por propuesta        | No      | El Terminal tiene hilo y Historia. |
| Worktree por propuesta          | No      | El Terminal edita el árbol real bajo ADR-079. |
| Presupuesto por propuesta       | No      | Es del Motor. Aquí sería un freno (§3). |
| DEBUT y severidad como tope     | No      | Ya resuelto en ADR-088: son del Motor. |

Esta tabla es la lectura operativa de la doctrina de los dos mundos: el Motor se
repara a sí mismo bajo sus reglas; el Terminal sirve al cliente bajo las suyas.

---

## 5. Qué NO cambia

- **LOOP ya está cubierto.** Corre a través del Motor:
  `src/infrastructure/loop/loop-fix.ts:38` → `runMotorChain`, y ahí
  `run-motor-chain.ts:65` ya llama a `judgeAndIntegrate`, que no integra nada
  sin veredicto (`judge-and-integrate.ts:56`). LOOP ya tiene worktree, correa,
  gate, OMEGA y criterios de parada. **No entra en este ADR.** La pregunta del
  operador —«¿esto aplica también a LOOP, que es autónomo igual?»— tiene esta
  respuesta: aplica el estándar del §0, sí; el cambio de código, no, porque ya
  lo tiene.
- **El lote supervisado sigue parando donde para.**
  `src/presentation/services/lote-por-enter.ts:21` («PUNTO DE PARADA. Aquí
  espera el APROBADOR del lote») es correcto y se queda. La aprobación humana
  no es un freno: es la firma, y la firma es la garantía (ADR-089).
- **Las tres garantías estructurales de ADR-089 siguen enteras**: repo propio de
  FORTRESS, proyecto sin confianza, y sin red git → supervisado.
- **La cola no para por un desenlace.**
  `src/presentation/services/cola-del-lote.ts:35` ya lo dice. Y en su línea 38
  el código ya anticipaba este ADR por su nombre: *«NO arranca en autónomo: allí
  el plan lo aprueba OMEGA, que llega con la pieza»*. Con la Fase A, esa espera
  termina; el guard de `cola-del-lote.ts:46` y el de
  `preparar-lote.ts:23` se levantan.

---

## 6. La propuesta que hice y que el operador rechazó

Se deja escrita porque el razonamiento que la produjo volverá, con otra cara.

Tras medir el §1 lectura 3, propuse: *«dar a los críticos el diff pre-cocinado
al estilo OMEGA, sin dejarles navegar, porque son 13 veces más baratos así»*.
La medición era correcta ($6.79 contra $0.53; 55.2 vueltas contra 8.3).

**El operador la rechazó**: es un freno disfrazado de optimización.

Y tiene razón, por una razón que la medición no podía ver. OMEGA es barato sin
navegar porque su pregunta **no necesita navegación**: «¿este diff hace lo que
el análisis dice?» se responde con el diff y el análisis delante. La pregunta
del crítico es otra: «¿este fix rompe algo en otra parte? ¿el atacante tiene un
segundo camino? ¿hay tres sitios más con este patrón?». Esa pregunta **solo se
responde navegando**. Quitarle la navegación no lo abarata: lo convierte en un
agente distinto, que responde una pregunta que nadie hizo, y encima parece que
funciona porque devuelve un veredicto.

La lección, escrita para la próxima vez: **una medición de coste puede ser
exacta y aun así sostener una conclusión falsa, si compara dos agentes que no
hacen la misma pregunta.** El coste medido es un dato para el operador que
firma; nunca un argumento de diseño contra la profundidad.

Lo que el operador sí aceptó de esas lecturas es la asimetría del §2: el escaneo
lee, el Terminal autónomo escribe, luego OMEGA juzga **antes** de conservar. Eso
es orden, no límite.

---

## 7. Alternativas consideradas

**a) «Se detiene al primer fallo» — la enmienda muerta (`51a822b`).**
Propuse que el lote autónomo corriese sin parada pero se detuviera al primer
fallo, como puente hacia la Fase A. El operador lo cortó en seco: *«PARA — no
firmes esa enmienda»*. Detenerse y esperar es **supervisado con otro nombre**, y
además el peor de los dos: promete autonomía y entrega una espera. Un fallo
aislado es información sobre *ese* hallazgo, no sobre los N restantes; parar el
lote entero convierte un dato local en un bloqueo global. La rama queda
descartada, sin fusionar. Lo correcto es lo del §3: no avanza → revertir ese
hallazgo con su razón escrita → siguiente.

**b) Que el productor revise su propio trabajo.**
Más barato, y sin agentes nuevos. Descartado: un modelo revisando lo que acaba
de escribir tiende a confirmarlo. La corrección viene del encargo opuesto, no de
la segunda pasada (§2, Fase B).

**c) Críticos con el diff pre-cocinado, sin navegar.**
Descartada por el operador. Razón completa en §6.

**d) Un contador de reintentos.**
Simple y predecible. Descartado: es un freno con reloj. Lo que importa no es
cuántas veces se intentó sino si hay avance (§3).

**e) Meter LOOP en este ADR.**
Descartado tras medir: ya corre por el Motor y ya tiene todo esto (§5).

---

## 8. Consecuencias

**A favor**

- El modo autónomo pasa a merecer su nombre: un lote entero sin intervención.
- Lo que se conserva pasó un juicio que no es el del autor del cambio.
- Se reusa lo construido: el juicio de OMEGA y la maquinaria de cadenas.
- El estándar del §0 queda grabado y es citable en la próxima discusión.

**En contra, dicho sin suavizar**

- **Cuesta dinero, y el operador debe saber cuánto.** Con los números del §1:
  un hallazgo CRITICAL con varios críticos que exploran de verdad puede rondar
  los **$20–35 y diez a quince minutos**. Un lote de diez CRITICAL, varios
  cientos de dólares. Esto **no es un argumento para recortar** —el §0 ya
  decidió ese empate— sino el dato que hace informada la firma. Escribirlo es
  honestidad; usarlo para frenar sería lo que este ADR prohíbe.
- Más piezas móviles: desacoplar `runOmega` toca código del Motor, que hoy
  funciona. Se hace con gate 5/5 y sin tocar el camino del Motor.
- Un lote autónomo largo es difícil de seguir en vivo. La Historia tiene que
  contar después lo que pasó, hallazgo por hallazgo, incluidos los no resueltos
  con su razón.

---

## 9. Referencias verificadas

Todas comprobadas contra `ea75924` el día de la firma.

| Ref | Qué dice |
| --- | -------- |
| `src/application/repair/run-omega.ts:50,51,55,64` | OMEGA acoplado a `GATE`, `eventLog`, worktree y presupuesto |
| `src/application/repair/run-omega-inputs.ts:14,31` | «OMEGA no navega»; las 5 entradas puras del juicio |
| `src/application/repair/run-motor-chain.ts:65` | `judgeAndIntegrate` en la cadena del Motor |
| `src/application/repair/judge-and-integrate.ts:56` | sin `APROBADO` no hay merge |
| `src/application/repair/record-motor-run.ts:37,44` | los agentes del Motor van con `agentId: null` |
| `src/application/workflow/run-workflow.ts:47,61,63,66` | orquestación multi-agente con contexto compartido |
| `src/domain/workflow/workflow-catalog.ts:28` | cadena `seguridad: [SECURITY, QUALITY, CLOSING_STEP]` |
| `src/application/chat/produce-reply.ts:58` | con foco, siempre productor único |
| `src/domain/repair/budget.ts:5,9` | 2.000.000 / 300.000 tokens — del Motor |
| `src/domain/agent/sentinel-omega.ts:30` | OMEGA en `model: 'opus'` |
| `src/domain/agent/escalera-de-modelos.ts:32` | `MODELO_DEL_PRODUCTOR` |
| `src/infrastructure/git/checkpoint-transitorio.ts:45` | lo editado queda sin stagear: `git diff` es el trabajo |
| `src/infrastructure/loop/loop-fix.ts:38` | LOOP corre por `runMotorChain` |
| `src/presentation/services/cola-del-lote.ts:35,38,46` | la cola no para; guard de autónomo esperando esta pieza |
| `src/presentation/services/preparar-lote.ts:23` | segundo guard de autónomo |
| `src/presentation/services/lote-por-enter.ts:21` | punto de parada del lote supervisado — se queda |

Medición de coste: 483 filas de `agent_runs` en la base del operador,
2026-09-17. Tabla en §1, lectura 3.

---

## 10. Relación con otras decisiones

- **Completa** [ADR-088](adr-088-terminal-grado-bancario.md) — es su Pieza 5.
- **Se apoya en** [ADR-089](adr-089-la-garantia-es-la-firma-no-una-lista-de-palabras.md)
  — el freno por palabra ya murió; este retira el freno por parada y prohíbe el
  freno por bolsillo.
- **Se apoya en** [ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md) — sin red no se edita;
  este ADR decide **quién juzga** antes de conservar lo editado.
- **No modifica** [ADR-087](adr-087-confirmar-un-hallazgo-exige-juicio.md) — el
  escaneo sigue como está; la asimetría del §2 explica por qué el Terminal
  necesita más.
