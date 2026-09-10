# ADR-082: El escaneo avanza por paradas, y declara su cobertura

- **Fecha:** 2026-09-09
- **Estado:** Aceptada
- **Área:** Escaneo · Cobertura · Telemetría

## Contexto

El escaneo audita el proyecto **entero de un golpe**, contra un reloj fijo, y si
el reloj gana no queda nada. Las tres piezas se midieron entre el 7 y el 9 de
septiembre de 2026, y encajan en un solo modo de fallo.

### El techo es fijo y el reloj no sabe de código

```
src/infrastructure/claude-code/run-claude-process.ts:7
const MAX_DURATION_MS = 15 * 60 * 1000
:16  const timer = setTimeout(() => child.kill('SIGTERM'), MAX_DURATION_MS)
```

Las 48 corridas de escaneo asentadas en `agent_runs` caen entre **6,5 y 13,8
minutos**. Ninguna llegó nunca a los 15. El techo parecía holgado porque nadie
había escaneado un repositorio grande.

### El primero que lo cruzó murió entero

`Health Flow V1_FINAL`: **2.108 ficheros rastreados**, doce veces `mailbd-main`
(176) y cincuenta y tres veces `APT BY` (40). Se escaneó, se vio el análisis
completo en pantalla, y al terminar la base tenía **cero filas suyas en las diez
tablas** que llevan `project_id` — ni `scans`, ni `findings`, ni `activity`, ni
`agent_runs`. Gastó tokens reales y no dejó constancia de haberlo hecho.

### La causa: el fallo es todo-o-nada, y el fallo no se registra

```
run-claude-process.ts:16   SIGTERM a los 15 min
claude-scanner.ts:39       if (reply.failed) return err(...)   ← se tiran usage, tools y duración
run-scan.ts:30             if (!outcome.ok) return err(...)    ← persistScan NUNCA se llama
commit-scan-rows.ts:35     context.transaction(...)            ← scans + findings + projects
                                                                 + agent_runs + activity, JUNTAS
```

Esa transacción única explica el cero exacto: **o entran las cinco tablas, o no
entra ninguna.** Y como `runs.record` vive dentro de ella con `failed: false`
escrito a mano (`commit-scan-rows.ts:47`), **un escaneo que falla no asienta ni
su gasto**. La columna `fallidas` del día marcaba 0, y era mentira.

De las tres piezas, ésta es la más grave. Un escaneo perdido se repite; un gasto
invisible corrompe la única cuenta que el operador tiene del dinero.

### Y no hay manifiesto: el escáner no sabe qué va a auditar

El alcance del escaneo es el `cwd` del proceso hijo y nada más. `ScanRequest`
lleva tres campos —`projectPath`, `projectName`, `projectId`— y ninguno acota.
`buildScanPrompt` recibe el **nombre** del proyecto, no su contenido. El agente
descubre los ficheros por su cuenta, y al terminar nadie puede decir cuántos
miró. **«Escaneé el proyecto» no es una afirmación verificable.**

### Subir el techo no arregla ninguna de las tres

Se midió antes de descartarlo. A los precios reales —`fortress-command-center`,
1.810 ficheros, promedia **$0,75/min** y llega a $1,15— un escaneo de 90 minutos
de Health Flow costaría **$90–$120**. Pero antes de eso lo mata otra puerta: el
tope por corrida está en $50 (`--max-budget-usd`, `claude-cli.ts:38`), que a ese
ritmo se agota **entre el minuto 38 y el 50**. Subir `MAX_DURATION_MS` a 90 sin
tocar el presupuesto no compra 90 minutos: compra 45, y el escaneo muere igual.

Y aunque se subieran los dos: **sigue siendo todo-o-nada**. Morir en el minuto
89 pierde exactamente lo mismo que morir en el 15, pero habiendo gastado ocho
veces más.

## Decisión

El escaneo deja de ser una carrera contra un reloj y pasa a ser **un recorrido
por paradas**. Seis piezas, en orden.

### 1. FORTRESS mide el proyecto antes de escanearlo

Un **manifiesto**: `git ls-files` filtrado por extensión de fuente. Cuántos
ficheros, en qué carpetas, con qué peso. No es maquinaria nueva —
`maintainability-probe.ts:29` ya lo hace exactamente así para contar ficheros
largos—; lo nuevo es que el escaneo lo use y lo guarde.

Medir primero es lo que permite todo lo demás: sin saber qué hay, no se puede
dividir, ni priorizar, ni declarar cobertura al final.

### 2. Divide por CARPETA de alto nivel, no por tiempo

Una parada por tiempo quedaría a mitad de un fichero, y un fichero a medias no
es una auditoría, es un corte. **Cada parada es un pedazo de código con sentido
arquitectónico que termina limpio.**

El orden lo decide el **grafo** cuando existe (`has_graph = 1`): las zonas
sensibles —autenticación, pagos, acceso a datos— primero, que es lo que ya
persigue `GRAPH_FIRST_SECURITY`. Sin grafo, orden por carpeta. La prioridad
cambia qué se audita antes, nunca qué se audita: la última parada se hace igual.

### 3. Escanea parada por parada, SIN TECHO DE TIEMPO

Cada parada termina cuando su pedazo está auditado entero, tarde lo que tarde.

Quitar el reloj no es quitar la salvaguarda: es cambiarla por una mejor. **La
seguridad no viene de un temporizador sino de que cada parada es finita por
construcción** — un pedazo de código se acaba. El reloj protegía contra un
proceso colgado y de paso mataba a los que solo eran grandes; no sabía
distinguirlos porque no sabía nada del código. El manifiesto sí: una parada que
no avanza sobre una lista conocida de ficheros es detectable sin cronómetro.

Y la garantía que el reloj nunca pudo dar: **nunca se queda a mitad**. Se guarda
al terminar el pedazo, no cuando suena una alarma.

### 4. Guarda y reporta cada parada al terminar

Los hallazgos **acumulan**. No hay que construir nada para eso:

```
finding-writes.ts:59-70
const sync = db.transaction((projectId, rows, conservados) => {
  for (const row of rows) {
    const existing = byIdentity.get(projectId, row.identity)
    if (!existing) insert.run(row)
    else (conservados.has(existing.id) ? touchKeep : touch).run(...)
  }
})
// "Lo que este escaneo NO nombro no se toca — se queda con su lastSeen viejo."
```

Es un upsert por `identity`, fila a fila, **sin DELETE**. Idempotente por
construcción. [ADR-065](adr-065-nada-muere-sin-juicio.md) se lo dio gratis al
decidir que el escaneo no extingue: como no borra ausentes, tampoco borra lo que
todavía no ha visto.

El score se recalcula tras cada parada — `scoreFromFindings` es una función pura
del multiconjunto de severidades—, y el operador ve avanzar el trabajo:
**«parada 4 de 12 lista, N hallazgos»**, en vivo y ya guardado.

### 5. Cobertura declarada al cerrar

**«Audité X de Y ficheros.»**

Es la pieza que convierte «escaneé» en «escaneé línea por línea, y aquí está la
cuenta». Un número que se puede contrastar contra el manifiesto, no una promesa.
Sin él, la profundidad de un escaneo es una impresión; con él es un dato que
envejece bien y que un tercero puede revisar.

### 6. El fallo deja rastro — innegociable

**Toda parada y todo intento se registra: éxito o fallo, con su gasto real, su
duración y su motivo.** Nunca más un token gastado en silencio.

El puerto ya existe y ya contempla el caso. `NewAgentRun` lleva
`failed: boolean`, y `usage` es opcional **a propósito**:

> «`undefined` si no se pudo leer — un SIGKILL antes de que el CLI la emitiera.
> No es lo mismo que una factura de ceros: aquella afirma que salió gratis. La
> corrida se asienta igual, y su duración con ella.»
> — `domain/telemetry/agent-run.ts`

El modelo de datos llevaba tiempo preparado para esto; solo el escaneo no lo
usaba. `recordChatRun` es el precedente exacto: asienta el fallo en su propia
transacción, con `try/catch` y silencio deliberado, porque perder una fila de
telemetría no puede tumbar el trabajo.

Y **el output crudo se persiste a disco**, un registro por escaneo, con el molde
de `cognition-writer.ts` —puerto en dominio, implementación en infraestructura—
y pasando por `redactSecrets`. Hoy la única copia del análisis viajaba al
renderer para pintarse y se perdía con la ventana.

### El estado abierto/cerrado de `scans`

La tabla no tiene estado en progreso: una fila nace con su score final o no
nace. Se añaden columnas con el molde de `columnas-sueltas.ts`, **solo
`ALTER TABLE ADD COLUMN`**, sin reconstruir nada:

| columna | default | por qué |
|---|---|---|
| `estado` | `'CERRADO'` | ABIERTO / CERRADO / ABORTADO. `CERRADO` es el lado seguro: las 50 filas existentes **son** escaneos terminados |
| `started_at` | null | hoy solo existe `at`, que es la hora de **cierre** |
| `paradas_total` · `paradas_hechas` | null | null = escaneo de una sola pieza |
| `ficheros_total` · `ficheros_cubiertos` | null | la cobertura declarada; null = no se midió, que es la verdad de las 50 filas de hoy |
| `motivo_cierre` | null | `completo` / `timeout` / `presupuesto` / `abortado` |

**`score` se queda `NOT NULL`.** SQLite no puede quitar un `NOT NULL` con
`ALTER TABLE`: hacerlo nullable exigiría el recambio de tabla de
[ADR-077](adr-077-cuando-una-migracion-deja-de-ser-aditiva.md) sobre 50 filas,
para no ganar nada. La verdad «este número es provisional» la porta `estado =
'ABIERTO'`, y la migración se queda aditiva.

`ScanHistoryRepository` gana un método de cierre. Hoy es append-only —`record`,
`listByProject`, `listSince`— y no sabe actualizar una fila.

## Consecuencias

- **El techo de 15 minutos desaparece para el escaneo, y solo para él.** Los
  otros cinco caminos que comparten `collectRun` —chat/Terminal, LOOP, Génesis,
  Build y el grafo A/B— conservan el suyo. Se hace por *factory*, el patrón que
  `graph-generator.ts:31` y `graph-omega.ts:24` ya usan: `scan-handlers` pasa su
  valor y quien no pasa nada se queda con el de siempre.
- **No cruza innegociable**, con dos condiciones que son parte de la decisión:
  el carril se toma **una vez** para todo el arco de paradas, y el presupuesto
  **no se trocea**. Así `run-guard.ts` y `claude-cli.ts` —los dos únicos
  ficheros protegidos que la cadena roza— quedan intactos.
- **El coste se vuelve aliado.** Doce paradas de ~$10 **que se guardan**, en vez
  de $120 de un tirón que se pueden perder enteros. Si el escaneo se corta en la
  parada 8, quedan ocho pedazos auditados y guardados. Hoy, cortarse en el
  minuto 14 deja cero.
- **El operador ve avanzar el trabajo.** Hoy un escaneo largo es una barra de
  progreso y una apuesta; con paradas es una cuenta que sube y no baja.
- **Riesgo de la extracción, dicho de antemano.** Si el arco parte
  `scan-handlers.ts`, el sitio que llama a `guardRun` se muda a un fichero nuevo
  **sin protección** — el hueco que `innegociables-defensa.ts` documenta cuatro
  veces en su propio docblock: «al partir un módulo, la mitad que decidía se
  quedaba fuera». Si eso ocurre, **el fichero nuevo entra en la lista
  innegociable en el mismo commit que lo crea**, no después.
- **Más piezas móviles.** Un escaneo pasa de una transacción a N cierres de
  parada más un cierre de arco. Es complejidad real, y se acepta a cambio de que
  el trabajo hecho no se pierda.

## Visión documentada

Dirección futura, **no se construye en este arco**. Queda escrita para que las
decisiones de infraestructura de aquí no cierren puertas que harán falta.

- **Este arco es la infraestructura.** Encima se montará, arco por arco, la
  integración de las **17 plantillas de auditoría** —5 pasadas (P1–P5) y 12
  módulos (M1–M12)— que viven en `internal/AUDIT-KIT/`, fuera del repositorio
  público.
- **Regla de las plantillas: FORTRESS decide cuáles aplican por evidencia del
  código.** ¿Hay interfaz de usuario → M9? ¿Toca dinero → M8? ¿Datos personales
  → M3? ¿IA → M5? **Las 5 pasadas aplican siempre.** Lo que aplica se cumple
  entero. Lo que no aplica **se declara descartado con su razón** — nunca se
  calla. Es la doctrina de `ausencia.ts` aplicada a los módulos: no nombrar algo
  no es afirmar que no está.
- **Paradas y plantillas son la misma cosa desde dos ángulos.** El manifiesto
  (medir) **es** P1 Recon. Cada parada por carpeta **es** un pedazo de P3/P4
  línea por línea. La cobertura declarada **es** lo que las plantillas exigen
  para poder llamarse auditoría. Construir paradas es construir el esqueleto de
  las plantillas sin nombrarlas.
- **Las plantillas viven en `internal/` y el motor las leerá en runtime desde
  ahí.** Patrón cerebro/ejecutor: el ejecutor no las lleva empaquetadas.
  Decisión de diseño para el arco de integración, **no para éste**.

## Alternativas descartadas

**Subir el techo a 90 minutos.** Lo obvio, y no resuelve ninguna de las tres
piezas del contexto: sigue siendo todo-o-nada (morir en el minuto 89 pierde todo
igual), cuesta $90–120 por escaneo grande, y el tope de gasto de $50 por corrida
lo mata alrededor del minuto 45 — antes que el reloj. Se pagaría ocho veces más
por el mismo riesgo de perderlo todo.

**Escaneo incremental por hallazgo**, con el modelo emitiendo hallazgos uno a
uno según los encuentra. Es más fino que las paradas, y por eso se evaluó
primero. Exige rediseñar **dos** contratos a la vez: el del escáner
(`report-contract.ts:22` pide un único bloque JSON terminal, «y nada después») y
el del parser (`lastJsonBlock` se queda con el **último** bloque y tiraría todos
los anteriores — emitir por tandas hoy sería peor que no emitirlas). Las paradas
por carpeta **reutilizan el contrato tal cual, una vez por parada**, sin tocar
ni el prompt ni el parseo.

**Dividir por peso equilibrado** (N ficheros por parada, o N líneas). Reparte
mejor el trabajo y es trivial de calcular sobre el manifiesto. Pero corta
módulos a la mitad y rompe justo la propiedad que hace segura la parada: que
**termina limpio**. Media carpeta auditada no es un pedazo con sentido, y no se
puede afirmar nada sobre ella.

## Código

Ninguno todavía: esta decisión precede a su implementación. El arco tocará
`src/infrastructure/claude-code/run-claude-process.ts` ·
`src/infrastructure/scan/claude-scanner.ts` ·
`src/infrastructure/ipc/scan-handlers.ts` ·
`src/application/scan/persist-scan.ts` · `commit-scan-rows.ts` ·
`src/domain/scan/scan-record.ts` ·
`src/infrastructure/persistence/columnas-sueltas.ts`.

## Referencias

- [ADR-065](adr-065-nada-muere-sin-juicio.md) — el escaneo no extingue; es lo
  que hace que los hallazgos acumulen entre paradas sin construir nada.
- [ADR-077](adr-077-cuando-una-migracion-deja-de-ser-aditiva.md) — por qué la
  migración se mantiene aditiva y `score` no se toca.
- [ADR-080](adr-080-severidad-por-ejes-derivados.md),
  [ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) — el contrato
  del escáner que las paradas reutilizan sin cambiar.
- [FLOWS/SCAN](../FLOWS/SCAN.md) — el flujo que este ADR reescribe.
