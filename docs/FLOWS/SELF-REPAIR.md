# Flujo: auto-reparación

FORTRESS puede reparar hallazgos de sus propios escaneos de forma
disciplinada. Este documento describe el flujo end-to-end desde que un
hallazgo es elegido hasta que su fix se mergea localmente. Todo cambio pasa
por cinco juicios automáticos antes de que un humano lo firme, y ningún
cambio toca el árbol vivo del proyecto hasta esa firma.

La filosofía en una frase: **el motor propone, el humano dispone.**

## Visión general

```
 hallazgo ACTIVE
      |
      v
 [1. Elegir]          -> evento SELECT (lógica pura, cero tokens)
      |
      v
 [2. Entender]        -> claude-analyst, solo lectura
      |
      +--- OBSOLETO -----> CADUCADO (terminal: el hallazgo ya no aplica)
      |
      REAL
      v
 [3. Generar]         -> claude-generator, en worktree aislado
      |
      +--- fuera de correa / sin diff / error --> RECHAZADO (terminal)
      |
      v
 [4. Gate hermético]  -> npm ci + typecheck + lint + test:unit
      |
      +--- rojo o timeout -----------------------> RECHAZADO (terminal)
      |
      verde
      v
 [5. Revisor OMEGA]   -> claude-omega, 6 ejes + veredicto
      |
      +--- VETADO ------------------------------> RECHAZADO (terminal)
      |
      APROBADO
      v
 [Firma humana]       -> MERGEADO (merge local; push siempre humano)
```

## La máquina de estados

Estados: `ELEGIDO` → `ANALIZADO` → `GENERADO` → `GATE` → `OMEGA` →
`APROBADO` → `MERGEADO`, con `RECHAZADO` y `CADUCADO` como salidas en casi
cualquier punto. Las transiciones válidas están codificadas en el dominio y
son el único juez: ningún eslabón puede saltarse un estado ni revivir uno
terminal.

- `ELEGIDO`: la propuesta nació; quedó anclada al `base_sha` del repo.
- `ANALIZADO`: el análisis dictaminó REAL; lista para generar.
- `GENERADO`: hay fix commiteado en la rama de reparación del worktree.
- `GATE`: el gate hermético pasó; esperando al revisor.
- `OMEGA`: el revisor aprobó; esperando la firma humana.
- `APROBADO`: el humano firmó; en proceso de merge local.
- `MERGEADO` / `RECHAZADO` / `CADUCADO`: terminales. No se re-abren jamás
  (ver `docs/PRINCIPLES.md`, principio 12).

## Los cinco eslabones automáticos

### 1. Elegir

Selecciona el próximo hallazgo a reparar de forma DETERMINISTA: mismo
expediente, mismo elegido, en cualquier orden de llegada. La política de
debut limita el terreno: solo hallazgos LOW y MEDIUM son elegibles; HIGH y
CRITICAL exigen confianza acumulada antes de entrar al motor. Entre los
elegibles gana el de menor superficie de cambio (un control aditivo conocido
antes que una reescritura de lógica). No cuesta tokens: es lógica pura.
Emite el evento SELECT al libro de vida.

### 2. Entender

Verifica que el hallazgo elegido sigue siendo real contra el código VIVO,
no solo contra el grafo. El agente (claude-analyst, modo solo lectura)
consulta el Knowledge Graph primero — es dos órdenes de magnitud más barato
que leer archivos — pero el veredicto final se verifica contra el archivo
real: si el grafo está desactualizado, el código vivo prevalece.

Salidas: **REAL** (procede a generar) u **OBSOLETO** (la propuesta CADUCA y
el hallazgo se excluye hasta el próximo escaneo — reparar fantasmas gasta
presupuesto y ensucia historia). Este eslabón ya evitó en producción un fix
que habría duplicado un guard existente.

Emisión: AGENT_RUN con coste real de tokens y duración, más la transición
con el análisis completo como evidencia. Coste típico: decenas de segundos a
minutos; cientos de miles de tokens según el tamaño del contexto.

### 3. Generar

Produce el fix mínimo que ataca exactamente lo que el análisis identificó.
El agente (claude-generator, con permiso de edición) trabaja dentro de un
worktree aislado creado sobre el `base_sha` de la propuesta: nunca ve ni
toca el árbol vivo del proyecto.

Dos frenos activos durante la generación:

- **Correa de alcance:** solo puede modificar los archivos permitidos,
  calculados desde el archivo estructurado del hallazgo más sus tests
  hermanos. Un diff que se sale de la correa rechaza la propuesta.
- **Presupuesto:** si el gasto acumulado más el coste del generador supera
  `MAX_TOKENS_PER_PROPOSAL` (2.000.000 de tokens por propuesta), la
  propuesta se rechaza por presupuesto. El diseño reserva mínimos para que
  ningún eslabón deje al siguiente sin combustible: 200.000 para el
  generador y 300.000 para el revisor.

Salidas: fix commiteado en la rama de reparación, o RECHAZADO (fuera de
correa, sin diff producido, o error del generador). En los rechazos
posteriores a la generación el worktree se CONSERVA para autopsia.

### 4. Gate hermético

Corre sobre el worktree los mismos comandos que un humano correría antes de
confiar en un cambio: `npm ci` (instalación limpia, sin reusar los
node_modules del proyecto) y después typecheck, lint y tests unitarios, en
orden fijo y cada uno bloqueante.

- Timeouts: 15 minutos para `npm ci`; 10 minutos por cada comando de
  verificación.
- Cola serial de uno a nivel de proceso (compartida con el revisor): dos
  juicios nunca compiten por la máquina.
- Emisión: un AGENT_RUN por comando con su código de salida, duración y los
  últimos 2000 caracteres de stdout y stderr — la factura detallada que
  después permite separar tiempo de máquina de tiempo humano
  (`docs/PRINCIPLES.md`, principio 4).

Salidas: verde (pasa al revisor) o RECHAZADO con autopsia (comando fallido,
timeout, o instalación imposible).

### 5. Revisor semántico (OMEGA)

El gate prueba que el fix compila y pasa tests; el revisor juzga si además
RESUELVE el hallazgo con calidad y sin daño colateral. El agente
(claude-omega, modo lectura estricta; distinto del meta-auditor de escaneos
— ver `docs/GLOSSARY.md`) recibe el análisis original, el diff completo y
los archivos antes y después.

Devuelve seis ejes: resuelve el hallazgo, respeta el alcance, respeta lo
intocable, calidad del diff, riesgo residual y veredicto global. El veto
solo procede por cuatro vías: no resuelve, viola alcance, toca lo
intocable, o riesgo mayor. Y una salvaguarda clave: **el motor recomputa el
veredicto global desde los seis ejes** — si difiere del que el agente
reportó, prevalece el cómputo del motor y la discrepancia queda asentada
(`docs/PRINCIPLES.md`, principio 10). Timeout: 15 minutos.

Coste típico: decenas de segundos; decenas de miles de tokens.

## La firma humana (única intervención manual del flujo)

Con la propuesta en estado OMEGA, el humano decide. La doctrina del eslabón:

- Verificaciones previas al merge: el HEAD del proyecto debe seguir siendo
  el `base_sha` de la propuesta (si main se movió, la propuesta caduca —
  nunca rebase automático), el worktree limpio, la rama viva.
- Merge local con `--no-ff` desde la rama de reparación.
- El push a origin es del humano, siempre. El motor jamás empuja.

Estado honesto: el flujo de firma integrado en la aplicación está en
construcción; hoy la firma se ejecuta como merge manual del operador en su
terminal, con esas mismas verificaciones. La doctrina no cambia con la
integración: solo cambia dónde se pulsa.

## Trazabilidad: el libro de vida

Cada eslabón emite eventos a un registro append-only por propuesta (tabla
local `proposal_events`, SQLite): identificador de propuesta, secuencia
monótona, fase, tipo de evento, actor, coste en tokens, duración, razón y
evidencia estructurada en JSON.

- Sin telemetría externa: el libro es local. Nadie más lo ve.
- La emisión es telemetría, no gate: si el libro falla, el motor sigue; un
  evento jamás revierte un estado.
- Sirve para reconstruir qué hizo el motor con cada propuesta, medir costes
  reales y separar "no está" de "está pero la interfaz no lo muestra"
  (`docs/PRINCIPLES.md`, principio 7).

## Ejemplo concreto: propuesta 675723c5

Hallazgo original: un directorio padre sin validar permitía crear carpetas
arbitrarias y filtrar listados (severidad LOW). Cadena completa real:

| Eslabón | Resultado | Coste |
|---|---|---|
| Elegir | Seleccionado por menor superficie | 0 tokens |
| Entender | REAL — el hallazgo persistía en el código vivo | 485.917 tokens · 145 s |
| Generar | Fix commiteado en worktree: 2 archivos, +19/−3 líneas; reutilizó un guard existente del dominio hallado vía grafo | 296.811 tokens · 86 s |
| Gate | npm ci (63 s, 451 paquetes) + typecheck (27 s) + lint (45 s) + test:unit (34 s, 844 tests) — todo verde | 169 s totales |
| Revisor | resuelve=SÍ · alcance=SÍ · intocable=SÍ · calidad=BUENO · riesgo=MENOR → APROBADO | 49.328 tokens · 37 s |

Coste total: **832.056 de 2.000.000 tokens permitidos** — cabe con margen.
El revisor dejó además un riesgo residual honesto documentado (un caso que
el fix no cubre y que exige decisión humana), exactamente el tipo de juicio
por el que existe un revisor semántico además de un gate mecánico.

Estado al momento de escribir este documento: OMEGA (aprobado), esperando
firma humana.

## Salvaguardas de seguridad

FORTRESS **no se auto-repara sobre su binario en vivo**. Un guard de
dominio puro impide que los ciclos autónomos y el motor operen sobre el
código del propio FORTRESS en caliente; está aplicado por múltiples capas
independientes y verificado en el binario distribuido, no solo en el código
fuente. El motivo: si el motor se autorreparara mientras corre, cualquier
fallo podría dejarlo en un estado inconsistente sin manera de recuperarse.
La reparación del propio FORTRESS existe, pero como flujo disciplinado con
firma humana y rebuild en frío — nunca como loop autónomo. El motor puede
reparar cualquier otro proyecto que el usuario configure.

El resto del modelo de amenazas relevante (aislamiento del worktree,
presupuestos, prompt injection en los metadatos del hallazgo) está en
`docs/SECURITY-MODEL.md`.

## Rechazos y sus significados

| Razón | Significado |
|---|---|
| `scope_violation` | El generador tocó archivos fuera de la correa. |
| `no_diff_produced` | El generador terminó sin producir cambios. |
| `generator_error` | El generador falló o excedió su timeout. |
| `budget_exceeded` | El coste acumulado superó el presupuesto por propuesta. |
| `gate_failed` | Un comando del gate salió con código distinto de 0. |
| `gate_timeout` | Un comando del gate excedió su timeout. |
| `npm_ci_failed` | La instalación limpia del worktree falló. |
| `omega_vetado` | El revisor vetó por una de las cuatro vías duras. |
| `omega_timeout` | El revisor excedió su timeout. |
| `omega_response_invalid` | La respuesta del revisor no fue parseable. |
| `worktree_missing` / `worktree_contaminated` | El worktree se perdió o estaba sucio al retomar. |
| `superseded` | Una propuesta más nueva sobre el mismo hallazgo la reemplazó. |
| `orphan_before_generate` | La corrida quedó huérfana (app cerrada a mitad) y se cerró al reclamar. |

## Reintento explícito

Cuando una propuesta queda RECHAZADO por razones de RAZONAMIENTO
(`omega_vetado`, `scope_violation`, `no_diff_produced`, `generator_error`),
el humano puede pulsar "Reintentar". El reintento crea una propuesta NUEVA
con `base_sha` fresco (el HEAD actual) y un vínculo textual a la previa; la
vieja queda inmutable. Los rechazos TÉCNICOS (presupuesto, timeouts,
worktree perdido) no ofrecen reintento: repetir sin arreglar la causa daría
lo mismo. Detalle del flujo: `docs/FLOWS/RETRY.md`.

## Ubicación en la UI

El motor no es solo un flujo de fondo: el operador lo conduce desde una
vista. Vive en **Auto-mejora FORTRESS** (nombre interno del view `sistema`),
en su sección **Motor de reparación** — la tercera de tres secciones
apiladas, bajo el backlog de observaciones y las capacidades.

Cada propuesta se muestra con su estado de la máquina y los botones del
eslabón que toca, visibles solo en el estado correcto: generar el fix, correr
el gate, correr el revisor OMEGA y reintentar una propuesta rechazada por
razones de razonamiento. La firma del merge sigue la doctrina de arriba: hoy
es un merge manual del operador — no hay un botón de firma en la app todavía
(la integración está en construcción; ver `docs/PRINCIPLES.md`, principio
17).

Detalle de la vista: `docs/PAGES/auto-mejora.md`.

## Referencias

- `docs/ARCHITECTURE.md` — arquitectura DDD del motor y del resto del
  sistema.
- `docs/PRINCIPLES.md` — principios aplicados aquí: 4 (telemetría del
  libro), 6 (datos vs metadatos en prompts), 10 (veredictos recomputados),
  11 (la cola es de proceso), 12 (los terminales no se re-abren).
- `docs/GLOSSARY.md` — todos los términos de este flujo.
- `docs/SECURITY-MODEL.md` — modelo de amenazas.
- `docs/FLOWS/GRAPH-REINDEX.md` — cómo el grafo se mantiene alineado con el
  HEAD.
- `docs/FLOWS/RETRY.md` — flujo de reintento explícito.
- `docs/AGENTS.md` — claude-analyst, claude-generator, claude-omega y el
  corredor del gate.
- `docs/DATA-MODEL.md` — tablas de propuestas y del libro de vida.
- `docs/PAGES/auto-mejora.md` — la vista que opera este motor.
