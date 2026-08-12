# Flujo: ciclo de vida de capacidades

FORTRESS puede aprender capacidades nuevas a lo largo de su uso. Una
capacidad es algo que el sistema se propone crearse: una función, una
herramienta o un agente. La forma más visible hoy es el agente-como-dato —
un agente nuevo que se propone, se redacta y se activa — pero el mecanismo
es general. Este documento describe primero el ciclo genérico (aplica a
cualquier capacidad) y después la especialización para agentes.

## Capa 1 — Ciclo de vida genérico

### Dos ejes ortogonales: fase y madurez

El sistema tiene dos ejes que el código separa a propósito. Confundirlos es
la trampa más común al leerlo por primera vez.

**Eje 1 — Fase (derivada de la CANTIDAD de episodios).** Cuántas veces se ha
ejercitado la capacidad:

| Fase | Episodios |
|---|---|
| propuesta | menos de 1.000 |
| prueba | 1.000 o más |
| ciclo | 20.000 o más |
| oficial | 50.000 o más |

Los umbrales son parámetros observables (1.000, 20.000, 50.000).

**Eje 2 — Madurez (derivada de la CALIDAD de los episodios).** Un puntaje de
0 a 50.000 calculado como episodios × cumplimiento × (1 − tasa de fallos),
redondeado. Literal del código: **"el sistema no se pone su propia nota; el
número sale de lo que de verdad pasó, y por eso no puede mentir"** — es el
principio de veredictos derivados ([PRINCIPLES](../PRINCIPLES.md), 10)
aplicado al ciclo de capacidades.

Por qué ortogonales:

- Una capacidad puede tener MUCHOS episodios (fase avanzada) y MADUREZ
  BAJA si fallaron mucho.
- Puede tener POCOS episodios (fase inicial) y MADUREZ ALTA si los pocos
  fueron impecables.
- La fase habla de exposición; la madurez, de calidad. Los dos importan;
  ninguno reemplaza al otro.

### Los estados (fases)

- **propuesta:** declarada pero inerte. No hace nada. Riesgo cero. Visible
  en el panel.
- **prueba / ciclo:** evidencia acumulándose; elegible para promoción a la
  fase inmediatamente superior si OMEGA no veta.
- **oficial:** máxima evidencia acumulada.

Ninguna capacidad salta de propuesta a activa sin episodios que demuestren
recorrido.

### Episodios: la evidencia

Un episodio es una corrida controlada que produce datos observables. Los
episodios se persisten y alimentan tanto la fase (por conteo) como la
madurez (por calidad). Dos modos:

1. **Manual:** el operador dispara un episodio contra una capacidad.
2. **Automático:** la capacidad se plantea y resuelve un escenario por su
   cuenta (con guardia de corrida para coste y concurrencia).

Todos corren en **sandbox**: una carpeta aislada del proyecto real, en modo
sin edición (el agente PROPONE acciones pero no toca el filesystem), con la
confianza desactivada (no puede escapar del sandbox). Cero riesgo sobre el
proyecto vivo del operador. El bucle continuo de episodios automáticos es la
génesis, con su propio flujo ([GENESIS](GENESIS.md)).

### Gate por kind — tres tipos, tres reglas

Cada capacidad tiene un kind al declararse. Verificado en el código:

- **funcion:** una pieza de lógica que hace algo específico. Reversible.
- **herramienta:** una utilidad invocable desde el catálogo. Reversible.
- **agente:** una entidad que participa en el chat o el escaneo. Altera el
  catálogo de agentes activos — irreversible en ese sentido.

Regla del gate:

- `funcion` y `herramienta` promueven SIN firma humana si OMEGA no veta.
- `agente` SIEMPRE requiere firma humana explícita del operador, aunque
  OMEGA apruebe.

La reversibilidad NO es un flag configurable: es una propiedad estructural
del kind. Un agente es irreversible por lo que ES, no por cómo se declaró —
el operador no puede marcar "este agente como reversible" para saltar el
gate.

### Veto de OMEGA — seis bandas

Sobre las capacidades, OMEGA aplica la MISMA puntuación por bandas que juzga
a los agentes. Las bandas verificadas contra el código:

| Banda | Rango | Comportamiento |
|---|---|---|
| confiable-absoluto | ≥ 90 | Paso libre |
| generalmente-confiable | ≥ 75 | Paso libre |
| cuestionable | ≥ 60 | Paso libre con reserva |
| no-confiable | ≥ 40 | VETO |
| no-usar | < 40 | VETO |
| sin-datos | (sin base) | SILENCIO |

OMEGA veta SOLO en `no-confiable` y `no-usar`. En `sin-datos` emite
silencio — ni aprueba ni veta; la promoción espera evidencia o pasa por
firma humana (el principio evidencia-o-silencio, ver [GLOSSARY](../GLOSSARY.md)).

Separación de poderes, literal del código: **"OMEGA solo puede FRENAR;
quien promueve es el gate por riesgo."** Un evaluador DESCRIBE la promoción
posible (elegible, destino, si necesita humano, si está bloqueada); otra
función DECIDE. Es testigo-no-actor aplicado al ciclo: OMEGA es el freno,
nunca el motor de avance.

### Seed de refuerzo

Agentes u operador pueden dejar notas de refuerzo hacia una capacidad —
anotaciones que explican por qué importa o ejemplifican su uso. Las notas
NO ejecutan nada: solo observan y refuerzan. Son evidencia narrativa
complementaria a los episodios numéricos.

### Flujo de promoción

```
 propuesta (declarada, inerte)
      |
      v
 ejercitar: episodios -> suben la fase (conteo) y la madurez (calidad)
      |
      v
 fase superior alcanzada -> elegible
      |
      v
 OMEGA evalua la banda
      |
      +--- no-confiable / no-usar --> VETO: permanece
      +--- sin-datos --------------> SILENCIO: espera evidencia o firma
      |
      v (paso libre)
 ¿kind = agente?
      |
      +--- no (funcion/herramienta) --> promueve
      +--- si (agente) -------------> requiere firma humana
      |
      v
 activa
```

## Capa 2 — Especialización: agente-como-dato

### El principio "datos, no código"

Cuando FORTRESS incorpora un agente nuevo, ese agente NO es código generado
que exija rebuild. Literal del código: **"un DATO que el motor consume vía
--agents, nunca código generado… Es solo un prompt con su nombre e icono"**
(en la versión actual lo redacta el operador; más adelante podrá redactarlo
un agente).

Motivación publicable: un sistema que genera código fuente y se rebuilda a
sí mismo tiene una superficie de riesgo desproporcionada. El agente-dato
tiene fronteras claras — entra al catálogo `--agents` del chat cuando se
despacha, y a ningún otro sitio. Su reversibilidad está garantizada por
construcción.

### Las tres etapas

- **Proponer** — alta de la capacidad-agente en estado propuesta. Manual
  (el operador rellena nombre y propósito) o automática (un agente redacta
  el borrador). Riesgo cero: nada ejecuta, nada se activa.
- **Borrador** — se redacta la definición: nombre, prompt e icono. Manual o
  como episodio automático en sandbox (modo sin edición). Aquí actúa el
  escaneo de contenido:

  Cuando se redacta el borrador, una auditoría de contenido escanea en
  busca de RED FLAGS; cualquier concern bloquea la activación en la etapa
  siguiente. La clase de contenido que las dispara: sugerencias de saltar
  permisos o autenticación, intentos de desactivar o bypass de guards,
  peticiones de ignorar reglas, o contenido que rebaje los frenos del
  sandbox. **La lista exacta de patrones NO se publica** — conocer qué
  frase dispara el flag ayudaría a redactar borradores que lo eviten sin
  cambiar la intención. Se publica la CLASE de protección, no el mecanismo
  de detección (mismo criterio que las áreas protegidas del chat).

- **Activar** — la firma humana obligatoria, con tres frenos EN ORDEN:
  1. Firma humana del operador (los agentes la exigen siempre).
  2. OMEGA sin concerns de contenido en el borrador (veta con la frase como
     evidencia; nunca aprueba por sí mismo).
  3. Techo de activos no excedido.

  Al activarse, la definición se inyecta en el despacho `--agents` del
  chat. Y a ningún otro sitio: NO entra al conjunto cerrado de
  identificadores de los 11 agentes originales, ni a la telemetría con un
  actor propio, ni al panel del meta-auditor. Es un agente de despacho, no
  un agente del sistema.

### Techo de agentes activos

Máximo 3 agentes-dato activos a la vez, con el comentario del código:
"freno v1, configurable a futuro". La motivación: prevenir la explosión
combinatoria de agentes indistinguibles que degradaría la calidad del
despacho — un catálogo con muchos agentes vagos produce peor resultado que
uno con pocos curados. Es un punto de partida conservador; el valor puede
ajustarse cuando haya evidencia dura de que la limitación es demasiado
estricta.

### Reversión instantánea

Cuando el operador desactiva un agente-dato, la reversión es inmediata.
Literal del código: **"deja de inyectarse. Reversión instantánea."** Sin
migración, sin cleanup, sin ventana de riesgo. La ausencia de residuo es
una propiedad estructural del diseño agente-como-dato: si no hay código
generado, no hay código que retirar.

## Salvaguardas

- Sandbox para episodios: nunca se ejercita en el proyecto vivo; modo sin
  edición, confianza desactivada.
- Guardia de corrida para episodios automáticos: cuota compartida con
  chat, escaneo y posture.
- OMEGA como freno: veta con evidencia, silencia sin datos, nunca aprueba
  por defecto.
- Firma humana para agentes: sin excepciones, por el kind.
- Escaneo de contenido del borrador antes de activar.
- Techo de activos: prevención de degradación combinatoria.
- Aislamiento: el agente-dato solo llega al despacho `--agents`; no
  contamina el conjunto de agentes del sistema ni su telemetría.

## Trazabilidad

Las tres tablas del ciclo ([DATA-MODEL](../DATA-MODEL.md)):

```sql
-- Capacidades de un proyecto por fase (la madurez se deriva, no se guarda cruda)
SELECT id, kind, name, phase, created_at
FROM capabilities ORDER BY created_at DESC;

-- Episodios de una capacidad (evidencia de fase y madurez)
SELECT outcome, summary, created_at
FROM capability_episodes
WHERE capability_id = ? ORDER BY created_at DESC LIMIT 20;

-- Notas de refuerzo
SELECT author, note, created_at
FROM capability_notes
WHERE capability_id = ? ORDER BY created_at DESC;
```

## Referencias

- [DATA-MODEL](../DATA-MODEL.md) — capabilities, capability_episodes,
  capability_notes y las definiciones de agente auto-creado.
- [FLOWS/GENESIS](GENESIS.md) — el bucle continuo de
  episodios automáticos.
- [AGENTS](../AGENTS.md) — los 11 agentes del sistema y cómo se distinguen
  del agente-dato.
- [GLOSSARY](../GLOSSARY.md) — capacidad, episodio, madurez, fase,
  testigo-no-actor.
- [PRINCIPLES](../PRINCIPLES.md) — principio 10 (veredictos derivados,
  aquí la madurez y el veto de OMEGA).
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el marco de amenazas de la
  auto-creación.
