# Flujo: bucle de génesis

El bucle de génesis es la frontera más autónoma del sistema: automatiza la
generación de episodios de capacidad en bucle continuo, con topes
obligatorios. Ejercita una capacidad por iteración, acumula su evidencia y
para en cuanto la decisión de seguridad lo pide. A diferencia del loop
autónomo pre-motor ([LOOP-VIEJO](LOOP-VIEJO.md)), génesis nunca toca el
proyecto del operador.

## Qué hace génesis, con precisión

Génesis **opera dentro del gate por kind** del ciclo de capacidades
([CAPABILITIES](CAPABILITIES.md), Capa 1). No es "propone-solamente" — es
más preciso: lo que ese gate permite hacer automáticamente (función,
herramienta) lo hace automáticamente; lo que exige firma humana (agente)
lo deja esperando firma. El gate no es del bucle; es del sistema de
capacidades. Génesis solo lo respeta.

En cada iteración:

- Elige una capacidad no-oficial y corre UN episodio en un sandbox
  aislado.
- **Avanza** la capacidad: promueve lo reversible (función, herramienta —
  que por su kind no requieren humano); un agente nuevo se deja PENDIENTE
  de firma humana.
- Persiste la evidencia y sigue, hasta que un tope o el operador lo
  detengan.

Lo que génesis **no** hace: no toca el filesystem del proyecto del
operador, no activa agentes (siempre esperan firma), no opera cross-proyecto
y no tiene pausa transitoria por fallo.

## Por qué génesis sobrevive y el loop-viejo se retira

La distinción no es "propone vs dispone" — es más fina.

El loop-viejo aplicaba cambios al proyecto del operador (código,
filesystem, commits) sin firma humana entre iteraciones. Violaba la
doctrina porque el resultado de cada iteración era una alteración externa
persistente.

Génesis avanza fases de capacidades REVERSIBLES en la propia base de
FORTRESS. Nunca toca el proyecto del operador. Los agentes (irreversibles)
siempre esperan firma. La reversibilidad estructural de función/herramienta
hace que auto-promoverlas NO viole la doctrina — el operador revierte en un
clic, sin residuo.

**"Génesis respeta el gate por kind. Lo reversible avanza; lo irreversible
espera firma. Nunca toca el proyecto del operador."**

Motivación del bucle continuo: las fases del ciclo de capacidades piden
muchos episodios (1.000 para pasar de propuesta a prueba, 20.000 para ciclo,
50.000 para oficial). Producirlos a mano sería agotador. Génesis los
automatiza dentro de topes que el operador fijó antes de encender.

## Comparación con el loop-viejo

| Aspecto | loop-viejo | génesis |
|---|---|---|
| Toca el proyecto del operador | Sí (código, commits) | No |
| Salida de cada iteración | commits en el árbol vivo | un episodio en la base |
| Qué avanza sin humano | fixes aplicados al proyecto | solo capacidades reversibles |
| Qué espera firma humana | (nada entre iteraciones) | los agentes (irreversibles) |
| Pausa transitoria (standby) | Sí | No |
| Estado planificado | retiro | sobrevive |

## Estado del bucle — dos fases

Génesis tiene 2 fases: **corriendo** y **parado**. No hay resiliencia
intermedia ni standby.

Decisión de diseño: génesis falla al primer error, sin pausa transitoria (a
diferencia del loop-viejo). En el dominio de capacidades, un fallo no es
transitorio — o el sandbox arrancó o no; no hay "esperar a que se recupere".
Fallo → parado, con su motivo, a esperar al humano.

## Topes obligatorios

El operador debe fijar AMBOS topes o el bucle no puede encenderse. No hay
valores por defecto: es un freno estructural. Los topes son parte de la
firma del encendido.

- **Tope de coste:** presupuesto de la sesión en USD.
- **Tope de episodios:** número máximo de episodios por sesión.

Ambos deben ser mayores que cero. Techos de parseo: **1.000 USD** y **1.000
episodios**. El loop-viejo tenía techo de 100 ciclos; génesis lo eleva a
1.000 episodios porque necesita miles para acercarse a los umbrales del
ciclo de capacidades (20.000 y 50.000). Es una decisión de escala coherente
con el dominio.

## Motivos de parada

En orden de prioridad (que es el orden de evaluación — el humano manda sobre
todo):

1. `detenido` — intervención humana.
2. `tope-gasto` — presupuesto de la sesión alcanzado.
3. `tope-episodios` — número máximo de episodios alcanzado.
4. `sin-trabajo` — no queda capacidad no-oficial por ejercitar.

`sin-trabajo` **no es un fallo: es éxito.** Significa que todas las
capacidades alcanzaron la fase oficial, o que no queda ninguna propuesta por
ejercitar. El trabajo terminó.

## El ciclo real

```
 Operador enciende con topes (USD, episodios)
      |
      v
 [bucle:]
      |
      +--- elegir la capacidad no-oficial con MENOS episodios (reparto justo)
      |
      +--- ¿parar? (humano / tope-gasto / tope-episodios / sin-trabajo)
      |        +--- si --> parado (con motivo)
      |
      +--- correr UN episodio en sandbox temporal (modo sin edicion, sin trust)
      |
      +--- avanzar: reversible promueve; agente queda pendiente de firma
      |
      +--- emitir progreso, esperar, siguiente iteracion
```

## Política de elección — reparto justo

Génesis elige, en cada iteración, la capacidad no-oficial con MENOS
episodios. Reparto justo: ninguna capacidad se queda atrás.

- Génesis NO acelera la promoción de las capacidades cercanas a un umbral.
- Garantiza COBERTURA: todas reciben atención equilibrada.
- Es coherente con los dos ejes (fase por conteo, madurez por calidad):
  ninguna capacidad domina el bucle por estar "casi lista".

## Rol de OMEGA

OMEGA no dirige el bucle. Su veto vive en dos puntos ya documentados en
[CAPABILITIES](CAPABILITIES.md):

1. El escaneo de contenido sobre los borradores de agente auto-generados
   (etapa borrador).
2. Las seis bandas al evaluar una promoción.

En el bucle mismo, el paso de avanzar respeta el gate por kind: los
reversibles avanzan (con OMEGA como freno), los agentes esperan firma
humana. Testigo-no-actor: OMEGA frena, no dirige.

## Salvaguardas

- **Sandbox estricto:** cada episodio corre en un directorio temporal del
  sistema (prefijo `fortress-genesis-`), NUNCA en el repo de FORTRESS ni en
  el proyecto del operador. Se limpia siempre con `finally`, incluso si el
  episodio falla. Modo sin edición, confianza desactivada. (Este mecanismo
  explica que un reindex del grafo pueda encontrar sesiones
  `tmp-fortress-genesis-*` si corre durante génesis: son sandboxes efímeros
  que existieron por segundos.)
- **Topes obligatorios** sin default: sin ambos, no hay encendido.
- **Guardia de corrida compartida:** la cuota del sistema; génesis compite
  con chat, escaneo, posture y capacidades.
- **OMEGA como freno** sobre borradores y promociones.
- **Aislamiento por proyecto:** génesis opera sobre el proyecto activo, no
  cross-proyecto.
- **Cero telemetría externa:** sesiones y episodios, todo local.

## Qué NO hace génesis

- NO edita archivos del proyecto del operador — vive en sandbox y base de
  datos.
- NO activa agentes: los borradores generados quedan pendientes de firma
  humana.
- NO promueve capacidades irreversibles solo; solo avanza reversibles.
- NO opera cross-proyecto.

## Trazabilidad

Los episodios NO se marcan como auto vs manual: la tabla de episodios tiene
solo resultado, resumen y fecha. La evidencia se pesa igual sin importar el
origen — auto vs manual es procedencia, no calidad del dato.

```sql
-- Episodios de una capacidad (sin distincion de origen)
SELECT outcome, summary, created_at
FROM capability_episodes
WHERE capability_id = ? ORDER BY created_at DESC LIMIT 20;

-- Capacidades con mas episodios acumulados
SELECT c.name, c.phase, COUNT(e.id) AS total_episodes
FROM capabilities c
LEFT JOIN capability_episodes e ON e.capability_id = c.id
WHERE c.project_id = ? GROUP BY c.id
ORDER BY total_episodes DESC LIMIT 10;
```

Trazar "cuánto avanzó génesis en las últimas horas" requiere correlacionar
el horario de los episodios con el estado del bucle (el push de estado de
génesis), no filtrar por una columna que no existe.

## Referencias

- [CAPABILITIES](CAPABILITIES.md) — el ciclo de vida y el gate por kind que
  génesis respeta.
- [LOOP-VIEJO](LOOP-VIEJO.md) — el bucle retirado y la comparación.
- [DATA-MODEL](../DATA-MODEL.md) — capabilities y capability_episodes.
- [IPC](../IPC.md) — los canales `system:genesis-*`.
- [AGENTS](../AGENTS.md) — OMEGA y su papel de freno.
- [PRINCIPLES](../PRINCIPLES.md) — la doctrina propone-dispone, aplicada
  aquí en su forma precisa (reversible vs irreversible externo).
