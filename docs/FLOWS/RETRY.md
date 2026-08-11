# Flujo: reintento explícito de propuestas rechazadas

El motor de auto-reparación puede rechazar una propuesta por muchas razones
(ver la tabla de rechazos en [SELF-REPAIR](SELF-REPAIR.md)). Algunas hablan
de la NATURALEZA del intento — el código no compila, el presupuesto se agotó
— y repetir daría lo mismo. Otras hablan del RAZONAMIENTO de un agente en
una corrida concreta: el generador se salió de su correa, no produjo diff,
falló, o el revisor vetó el fix. En esos casos tiene sentido reintentar: una
corrida fresca, sobre el código actual, puede llegar a mejor conclusión.

Este documento describe cuándo aparece el botón "Reintentar", qué crea, qué
guardas lo protegen y qué se preserva.

## Cuándo aparece el botón "Reintentar"

Solo en propuestas en estado RECHAZADO cuya razón de rechazo está en una
whitelist cerrada. El matcheo es por prefijo exacto: la razón se persiste a
veces con detalle ("omega_vetado: el fix no cubre...") y sigue contando;
un nombre parecido pero distinto no cuenta.

### Razones que permiten reintento

| Razón | Por qué tiene sentido reintentar |
|---|---|
| `omega_vetado` | El revisor vetó ese fix concreto; un generador fresco puede producir uno mejor. |
| `scope_violation` | El generador tocó fuera de la correa; otra corrida puede quedarse dentro. |
| `no_diff_produced` | El generador terminó sin cambios; otra corrida puede llegar a algo. |
| `generator_error` | Fallo de la corrida del generador; reintentar es lo obvio. |

### Razones que NO permiten reintento (y por qué)

- `gate_failed` / `gate_timeout` / `npm_ci_failed`: el código generado no
  pasa el juicio mecánico. Repetir sin cambiar nada dará lo mismo; puede
  hacer falta revisar la correa o el análisis.
- `budget_exceeded`: sin subir el presupuesto, reintentar no lo resuelve.
- `worktree_missing` / `worktree_contaminated`: problema de
  infraestructura, no de razonamiento.
- `superseded`: la propuesta ya fue reemplazada por otra; reintentar
  apilaría intentos en paralelo.
- `orphan_before_generate`: la corrida quedó huérfana antes de generar; no
  hay contexto que reintentar.

## Qué hace el reintento

Reintentar **no reabre** la propuesta rechazada — los estados terminales no
se re-abren jamás ([PRINCIPLES](../PRINCIPLES.md), principio 12). Crea una
propuesta NUEVA:

- `base_sha` = **HEAD actual**, no el de la vieja. Si el proyecto avanzó
  desde el intento previo, el reintento corre sobre código actualizado.
- Mismo hallazgo que la propuesta previa (el problema es el mismo).
- Razón de análisis que NACE con el vínculo textual `retry_of=<id corto de
  la previa>` — trazabilidad consultable desde el primer instante.
- Estado inicial ELEGIDO, con un matiz deliberado: **la elección no se
  repite**. El hallazgo se hereda de la propuesta previa (elegir de nuevo
  podría escoger otro hallazgo y eso no sería un reintento). Lo que corre
  completo y FRESCO es el análisis.

El análisis viejo no se reutiliza a propósito: el código probablemente
cambió, y la razón del rechazo pudo ser precisamente que aquel análisis se
equivocó. Reusarlo perpetuaría el error.

Y un final válido que no es fracaso: si el análisis fresco dictamina que el
hallazgo ya NO aplica (OBSOLETO), la propuesta nueva CADUCA. El reintento
sirvió para descubrir que ya no había nada que arreglar.

## Guardas antes de crear la propuesta nueva

En orden real de evaluación:

1. **Propuesta desconocida** — el identificador no existe: se rechaza el
   reintento.
2. **No reintenable** — el estado no es RECHAZADO o la razón no está en la
   whitelist: el botón ni siquiera se muestra, y el backend lo verifica de
   nuevo por su cuenta.
3. **Hallazgo extinto** (`finding_extinct`) — si el hallazgo ya no está
   vivo en el expediente (lo extinguió un escaneo posterior, con
   evidencia), no se inventa trabajo: no hay propuesta nueva.
4. **Ya reemplazada** (`already_superseded_by`) — si existe CUALQUIER
   propuesta posterior sobre el mismo hallazgo, no se apila: el mensaje
   indica cuál la reemplazó.

El anti-apilamiento no es una guarda aparte: **emerge de la guarda 4**. Un
reintento B es posterior a la propuesta A, así que A ya no puede
reintentarse otra vez (chocaría con B). Si B también acaba RECHAZADO por
razón reintenable, B sí puede reintentarse (nada es posterior a B). El
linaje queda lineal por construcción: A → B → C, sin cadenas divergentes.

Caso borde adicional: si el proyecto perdió su repositorio git (no hay HEAD
que anclar), el reintento se rechaza limpio.

## Qué se preserva y qué se pierde

Preservado:

- El hallazgo original (compartido entre ambas propuestas).
- La propuesta vieja COMPLETA: su estado RECHAZADO, su libro de vida, su
  veredicto y su razón. Es historia; nadie la muta.
- El vínculo textual `retry_of=<vieja>` en la nueva, que sobrevive en la
  razón de análisis incluso después del análisis fresco.

Perdido (deliberadamente):

- El análisis viejo (se corre uno fresco; ver arriba).
- El worktree viejo, según la política de limpieza del rechazo original.

## Flujo end-to-end del reintento

```
 Propuesta A: ... -> RECHAZADO (razon en whitelist)
      |
      |  humano pulsa "Reintentar"
      v
 [Guardas: existe? reintenable? hallazgo vivo? sin reemplazo posterior?]
      |
      |  todas OK
      v
 Propuesta B nueva:
   base_sha = HEAD actual
   mismo hallazgo que A
   razon nace con "retry_of=<A>"
   estado ELEGIDO (hallazgo heredado, sin re-eleccion)
      |
      v
 Analisis FRESCO (claude-analyst)
      |
      +--- OBSOLETO --> B CADUCA (el hallazgo ya no aplica: final valido)
      |
      REAL
      v
 Flujo normal: generar -> gate -> revisor -> firma
 
 La propuesta A permanece RECHAZADO. Su libro de vida no se toca.
```

## Trazabilidad

En el libro de vida de la propuesta nueva, el primer evento (la transición
de nacimiento a ELEGIDO) lleva como evidencia estructurada el hallazgo, el
identificador completo de la propuesta previa, el `base_sha` nuevo y la
marca de origen "retry". Un ingeniero puede reconstruir la cadena completa
de intentos siguiendo esos vínculos, o consultando las razones de análisis
que empiezan por `retry_of=`.

En la interfaz, la fila de la propuesta nueva muestra un indicador con el
identificador corto de la original ("retry de ...").

## Cuándo NO usar el reintento

Casos donde conviene investigar en lugar de reintentar mecánicamente:

- **Dos rechazos seguidos por la misma razón** (A y B ambas por
  `scope_violation`, por ejemplo): hay un patrón — el análisis no está
  identificando bien el archivo primario, o la correa es demasiado estrecha
  para ese hallazgo. Investigar antes de crear C.
- **El gate falla consistentemente por el mismo test:** el fix
  probablemente exige cambios que rompen ese test; el reintento no lo va a
  resolver. Puede necesitar replantear el análisis o el alcance.
- **Hallazgos HIGH o CRITICAL:** no están en el debut del motor y no
  deberían estar produciendo propuestas. Si aparecen, es una señal de
  cambio de política que debe firmarse por un humano, no automatizarse a
  base de reintentos.

## Referencias

- [SELF-REPAIR](SELF-REPAIR.md) — el flujo principal; el reintento es una
  arista de ese flujo.
- [PRINCIPLES](../PRINCIPLES.md) — principio 12 (los terminales no se
  reabren) y 11 (la cola es de proceso).
- [GLOSSARY](../GLOSSARY.md) — RECHAZADO, supersede, extinción honesta,
  base_sha.
- `docs/AGENTS.md` (por completar) — los agentes que corren en cada
  eslabón.
- `docs/DATA-MODEL.md` (por completar) — la tabla de propuestas y el libro
  de vida.
