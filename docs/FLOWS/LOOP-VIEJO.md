# Flujo: loop autónomo pre-motor

Este documento describe un sistema que HOY FUNCIONA pero está PLANIFICADO
PARA RETIRO, reemplazado por el motor de auto-reparación disciplinada. La
documentación sigue tres registros separados — por qué existió, qué hace
hoy, por qué se retira — y ninguno de los tres oculta a los otros.

## Estado de este flujo

**Operativo hoy · planificado para retiro.**

- **Presente:** sigue funcionando, accesible desde la interfaz, con todas
  sus salvaguardas activas.
- **Futuro:** se retira en un incremento futuro del plan del proyecto. El
  motor de auto-reparación ([SELF-REPAIR](SELF-REPAIR.md)) lo reemplaza
  con un diseño más disciplinado.
- **Lecciones preservadas:** varios conceptos del loop sobreviven en el
  motor, rediseñados. Otros se abandonan a propósito. El detalle, al final
  del documento.

## Por qué existió (registro histórico)

El loop autónomo se construyó para que FORTRESS pudiera trabajar un
proyecto SIN intervención humana entre iteraciones: escanear → arreglar →
verificar → re-escanear, en ciclo continuo, con frenos obligatorios. Fue
el primer sistema de la plataforma en cerrar el círculo completo de
"detectar y reparar" — y el terreno donde se aprendieron las lecciones que
después parieron al motor: los frenos deterministas, la red git, el
verify antes de continuar, y la doctrina que acabó siendo inviolable — el
motor propone, el humano dispone — nació precisamente de operar un sistema
que NO la tenía.

El motor de auto-reparación nace de las lecciones del loop, no como
negación del loop.

## Cómo funciona hoy (estado presente)

### Encendido: topes sin default (freno estructural)

El operador debe fijar AMBOS topes — coste de la sesión en USD y número
máximo de ciclos, ambos mayores que cero — o el loop NO puede encenderse.
No hay valores por defecto: es un freno estructural, no
configurable-por-omisión. Los techos de parseo (1000 USD, 100 ciclos) son
límites de sanidad, no defaults operativos.

La motivación: un sistema que corre solo con topes elegidos por el
diseñador y no por el operador tiene poder que el operador no entregó.
Los topes son parte de la firma del encendido. Además, el loop exige
proyecto confiable, y el propio repo de FORTRESS está bloqueado por
múltiples capas ([SECURITY-MODEL](../SECURITY-MODEL.md)).

### Las 7 fases

| Fase | Qué pasa |
|---|---|
| `escaneando` | Corre un escaneo y registra el score (el primero es la base del arco). |
| `esperando` | Pausa de cortesía entre fases (segundos), con chequeo de cancelación. |
| `reparando` | Un agente aplica el fix del hallazgo elegido — sobre el árbol vivo, tras snapshot git. |
| `verificando` | Typecheck tras el arreglo: la prueba de que no rompió el build. |
| `debate` | El score bajó tras el fix: rondas de alternativas (ver abajo). |
| `standby` | Pausa transitoria por fallo externo (API caída, sin crédito, red). |
| `parado` | Terminal, con su motivo. |

Cada transición se empuja al renderer por `loop:status`.

### Los 7 motivos de parada

En orden de prioridad — que es el orden de evaluación, y "el único sitio
que decide parar: un solo lugar canónico para la decisión":

1. `detenido` — intervención humana. El humano manda sobre todo.
2. `tope-gasto` — presupuesto de la sesión alcanzado.
3. `tope-ciclos` — máximo de iteraciones alcanzado.
4. `resuelto` — tres escaneos CONSECUTIVOS con 100/100 ("el arco se
   resolvió"); un score menor rompe la racha.
5. `build-roto` — el fix rompió la verificación: revertido y detenido.
6. `degradado` — un arreglo bajó el score: revertido y detenido.
7. `sin-solucion` — el debate agotó sus rondas sin superar el score
   previo: se rinde y para.

### El ciclo real

```
 escaneo base (punto de partida del arco)
      |
      v
 [¿parar? humano/gasto/ciclos/resuelto] --- si --> parado (con motivo)
      |
      v  (espera de cortesia, cancelable)
 snapshot git (checkpoint pre-fix)
      |
      v
 fix (agente, sobre el arbol vivo)
      |
      v
 verify (typecheck tras el arreglo)
      |
      +--- rompe --> revert al checkpoint + parado (build-roto)
      |
      v
 re-escaneo (el juez objetivo)
      |
      +--- score BAJO --> DEBATE:
      |       revert al checkpoint
      |       rondas de alternativas (cada intento sabe que
      |       el anterior empeoro); JUEZ = el proximo re-escaneo;
      |       gana el primer intento que SUPERE el score previo
      |       +--- alguna ronda gana --> continuar con ese score
      |       +--- max rondas sin ganar --> parado (sin-solucion)
      |
      v
 registrar score, ciclo += 1, esperar, volver a [¿parar?]
```

### El debate: juez objetivo, no LLM

La decisión de diseño más citada de este flujo, literal del código:
**"El juez es el re-escaneo objetivo, no un LLM."**

Cuando un fix aplicado BAJA el score: se revierte al checkpoint y se abren
rondas de alternativas — cada intento recibe el aviso de que el anterior
empeoró. El juez de cada ronda es el próximo re-escaneo: gana el primer
intento que SUPERE el score previo. Si ninguno lo supera en el máximo de
rondas, el debate se rinde (`sin-solucion`) y el loop para con el árbol
revertido.

Objetivo, no opinión: un juez LLM podría ser convencido por argumentos
elegantes de la defensa; el re-escaneo mide, no opina.

### Red git de seguridad

Antes de cada fix, un snapshot (checkpoint git del árbol vivo). El revert
se aplica en dos casos: build roto tras el fix, y al abrir el debate (el
arreglo que empeoró se deshace antes de probar alternativas). Si el loop
para por degradación o falta de solución, el árbol queda revertido — el
proyecto no conserva arreglos que empeoraron.

### STANDBY: pausa transitoria (no resiliencia post-reinicio)

`standby` es una fase INTRA-SESIÓN: un fallo transitorio — API caída, sin
crédito, red inestable — no mata el loop; lo deja en pausa esperando
recuperarse, dentro de la misma corrida, con su estado visible en la
interfaz.

Precisión de contrato (documentamos solo lo verificado): la sesión
persiste su progreso en la base local (activa, ciclos, scores recientes,
gasto base), pero la reanudación AUTOMÁTICA tras un reinicio de la
aplicación no forma parte del contrato verificado de este flujo hoy.

## Canales push del loop

Este dominio expone SOLO push — no hay invocaciones renderer → main; el
encendido va por el canal de proyectos con sus guards ([IPC](../IPC.md)).

- **`loop:status`** — payload rico en cada transición: fase (una de las
  7), ciclo y máximo, último score (o nulo si aún no hay), gasto de la
  sesión y su tope en USD, la racha de 100 seguidos (0 a 3, el conteo
  hacia `resuelto`) y el motivo de parada cuando la fase es `parado`.
- **`loop:chunk`** — output del agente en ejecución, durante `reparando` y
  el debate.

## Por qué se retira (registro futuro)

El motivo principal es doctrinal: **la continuidad automática del loop es
incompatible con "el motor propone, el humano dispone".** Un sistema que
encadena iteraciones sin firma humana no está proponiendo — está
ejecutando. Al elevar esa doctrina a inviolable (está en las decisiones
del motor y en [PRINCIPLES](../PRINCIPLES.md)), el loop tal como es hoy
queda fuera del diseño.

Motivos secundarios:

- Aplicar sobre el árbol VIVO — aun con red git — muta el espacio del
  operador durante el ciclo; el motor nunca toca el árbol hasta la firma.
- El debate por rondas gasta ciclos de agente en alternativas; el revisor
  semántico del motor (6 ejes, veredicto recomputado) juzga en una sola
  pasada. OMEGA no reemplaza al juez del debate — reemplaza a la defensa y
  al bucle juntos: simplificación por eliminación de bucle, no
  sustitución de mecanismo.
- La pausa transitoria (standby) añade complejidad de recuperación; el
  motor prefiere propuestas atómicas que fallan limpio y se reintentan
  explícitamente.

## Lo que se preserva y lo que se abandona

**"El motor aprende del loop, no lo hereda. Los conceptos sobreviven; los
mecanismos se rediseñan."**

Se preserva (evolucionado, no heredado):

- **Red git como concepto** — de checkpoint/revert sobre el árbol vivo a
  base anclada + worktree aislado.
- **Verify antes de continuar** — endurecido a gate hermético con
  instalación limpia, timeouts por comando y cola serial.
- **Presupuesto duro** — de tope en USD por sesión a techo de tokens por
  propuesta con reservas por eslabón.
- **Frenos deterministas y parada canónica** — la decisión de parar en un
  solo lugar sobrevive como la máquina de estados del motor.
- **El espíritu del juez objetivo** — el re-escaneo que mide sin opinar
  vive en el gate mecánico y en el veredicto recomputado por reglas.

Se abandona (a propósito):

- Aplicar sobre el árbol vivo (el motor SIEMPRE opera en worktree — el
  worktree es innovación del motor, no herencia del loop).
- Continuidad automática sin firma humana entre iteraciones.
- El debate por rondas (el revisor de 6 ejes lo reemplaza).
- La pausa transitoria standby (el motor falla limpio al primer error y
  ofrece reintento explícito).

## Trazabilidad

La sesión del loop persiste por proyecto (una sesión por proyecto; la
clave es el proyecto — [DATA-MODEL](../DATA-MODEL.md)):

```sql
-- Estado de la sesion del loop de un proyecto
SELECT active, cycles_done, recent_scores, spent_baseline, updated_at
FROM loop_sessions WHERE project_id = ?;
```

Los scores recientes se guardan como lista JSON (el más reciente primero);
la racha hacia `resuelto` se deriva de ellos. La factura de las corridas
de agente del loop vive en la telemetría de corridas, como todo lo demás.

## Salvaguardas

- Topes obligatorios sin default: sin ambos topes, no hay encendido.
- Proyecto confiable requerido; el repo propio de FORTRESS bloqueado por
  capas independientes.
- Red git: ningún arreglo que empeoró sobrevive a la parada.
- El loop NUNCA empuja a origin: los commits viven en local hasta que un
  humano decida.
- Cero telemetría externa: sesiones y scores, todo local.

## Referencias

- [FLOWS/SELF-REPAIR](SELF-REPAIR.md) — el motor que lo reemplaza.
- [DATA-MODEL](../DATA-MODEL.md) — la tabla de sesiones del loop.
- [IPC](../IPC.md) — los canales `loop:*` (solo push).
- [AGENTS](../AGENTS.md) — los agentes que el loop despacha.
- [PRINCIPLES](../PRINCIPLES.md) — principios 11, 12 y 17 (este documento
  es el caso más fuerte del 17: presente y diseño, separados).
- [DECISIONS](../DECISIONS/README.md) — la disciplina propone-dispone en
  las decisiones del motor.
