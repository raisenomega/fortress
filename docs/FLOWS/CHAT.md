# Flujo: chat con streaming

El chat es la superficie principal de interacción entre el operador y
FORTRESS: se escribe una intención, FORTRESS decide el motor, degrada el
modo si el contenido lo exige, enruta al agente o workflow adecuado,
transmite la respuesta por streaming y persiste la conversación por
proyecto. No es un chat que habla: es un agente que actúa, con frenos.
Este documento describe el flujo end-to-end tal como es hoy.

## Dos motores, elegidos por disponibilidad

- **claude-code (CLI):** si el binario está disponible Y su verificación
  previa sobre la carpeta del proyecto pasa, el agente ejecuta DE VERDAD
  dentro del proyecto (lee, edita bajo las reglas del modo, consulta el
  grafo).
- **api:** el fallback de solo-texto — responde sin acceso al filesystem,
  usando la key cifrada del operador.
- **Ninguno de los dos:** error claro con instrucción (instalar el CLI o
  configurar la key). Nada se invoca a ciegas.

Matiz de diseño con anclaje propio: **la elección ocurre ANTES de
persistir nada.** Un envío que no puede prosperar no debe dejar a medias
el historial del proyecto — primero se sabe si hay motor, después se
escribe el turno.

Para el usuario la elección es transparente: los chunks llegan igual. Lo
que cambia es la capacidad (ejecución real vs solo texto), y queda
registrada por mensaje.

## Diagrama del flujo

```
 Operador escribe (renderer)
      |
      v
 [invoke chat:send]  ->  [guardia de corrida por proyecto]
      |
      v
 [¿proyecto PENDIENTE de configuracion?]
      |
      +--- si --> la ENTREVISTA de configuracion es el unico trabajo
      |           permitido: el mensaje se redirige alli (vale en autonomo)
      |
      v
 [modo efectivo por PETICION: ¿el texto toca area protegida?]
      |
      +--- si --> esta peticion corre SUPERVISADA
      |
      v
 [elegir motor: claude-code si disponible+precheck, api si hay key]
      |
      v
 [persistir turno del usuario]  (solo ahora: ya se sabe que puede prosperar)
      |
      v
 [produceReply: respuesta simple | workflow | entrevista]
      |
      +--- chunks --> push chat:chunk {projectId, delta}
      +--- pasos  --> push chat:progress {index, total, tokens, costUsd}
      |
      v
 [persistir turno del asistente + chip del primer agente real]
      |
      v
 [telemetria de la corrida -> agent_runs]
      |
      +--- si fue auditoria integral: fijar la calidad general del proyecto
```

## Los canales de streaming (semántica real)

- **`chat:chunk`** — `{projectId, delta}`: texto incremental, en orden.
- **`chat:progress`** — `{projectId, index, total, tokens, costUsd}`: el
  MEDIDOR del workflow en vivo — paso i de N más el coste acumulado. NO es
  un canal de estados started/done/error.
- **El cierre** llega por la resolución de la Promise del invoke original
  (patrón general de [IPC](../IPC.md)): el resultado completo o el error
  viajan como retorno, no como evento.
- **El aborto** va por `chat:stop`: mata el GRUPO de procesos del agente
  ([PRINCIPLES](../PRINCIPLES.md), principio 5) y devuelve cuántos mató.

## Modos y degradación POR PETICIÓN

Dos modos de operación: **supervisado** (por defecto — propone y espera
aprobación) y **autónomo** (aplica y reporta; exige proyecto confiable).

La degradación NO es de sesión: **se evalúa el contenido de CADA
mensaje.** Si el texto toca un área protegida — por clase: autenticación y
sesión, pagos, base de datos y permisos, secretos y cifrado — esa petición
corre SUPERVISADA aunque el modo del proyecto sea autónomo. El siguiente
mensaje vuelve a ser autónomo si no toca áreas protegidas.

La detección cubre español e inglés, con normalización de acentos. La
historia de origen, publicada como advertencia: **el freno fallaba en
silencio porque "autenticacion" no contiene "auth"** — sin la cobertura
bilingüe y la normalización, el sistema tendería a operar en autónomo
sobre áreas críticas cada vez que el operador escribiera en español. La
regla existe por evidencia dura, no por prevención abstracta.

Y la doctrina que justifica el diseño conservador, tal cual la guarda el
código: **"sobre-degradar es seguro; infra-degradar es el peligro."** Como
mucho, el sistema pide permiso de más. Un mantenedor futuro que
"simplifique" la detección a una búsqueda simple en un solo idioma
destruiría el freno silenciosamente — esta doctrina es la vacuna.

## Bloqueo hasta CONFIGURADO: redirigir, no rechazar

Un proyecto en estado PENDIENTE de configuración no recibe trabajo normal
por el chat — pero el bloqueo es CONSTRUCTIVO: cualquier mensaje se
redirige a la entrevista de configuración guiada, que es el único trabajo
permitido en ese estado. La regla es autoritativa en el proceso principal
y **vale también en autónomo**: no se puede saltar por modo.

El porqué: sin proyecto configurado el agente no tiene doctrina propia, ni
ficha completa, ni decisión de confianza. Chatear así sería pedirle que
trabaje ciego. La redirección explica qué falta y guía a completarlo, en
lugar de rechazar en silencio.

## El system prompt real (sin envelope)

El chat normal **NO inyecta documentos de gobierno envueltos.** Lo que el
modelo recibe en cada petición:

1. **Identidad y pilares** (base fija: seguridad, calidad, estabilidad,
   transparencia; hallazgos con evidencia; honestidad en ambas
   direcciones).
2. **La ficha del proyecto:** nombre, ruta, stack, rama, y el score con la
   doctrina evidencia-o-silencio aplicada — si nadie ha escaneado, dice
   "sin escanear todavía", NUNCA "0/100" (describir como pésimo lo que
   nadie miró sería mentirle al modelo). Incluye el flag de si el proyecto
   tiene CLAUDE.md redactado.
3. **La lista de agentes ACTIVOS** del proyecto con sus propósitos (los
   apagados no aparecen).
4. **La instrucción del modo** — considerando la degradación por petición
   si aplicó.

El CLAUDE.md del proyecto lo lee **Claude Code por sí mismo** desde el cwd
cuando el motor es claude-code. FORTRESS no lo inyecta.

**Distinción importante:** los delimitadores de documento
(`<<<FORTRESS-DOC:...`) pertenecen al FLUJO DE CONFIGURACIÓN — la
entrevista donde el agente propone borradores de gobierno y la app captura
del texto persistido lo que escribirá a disco. Es otro flujo, con su
propia página. Buscar el envelope en el chat normal — o añadirlo "por
consistencia" — sería contaminar dos mecanismos que están separados a
propósito.

## Rutas de respuesta

El productor de respuesta enruta entre tres tipos:

1. **Respuesta simple** — conversación directa con el agente que el router
   eligió por la intención del mensaje (los toggles del catálogo excluyen:
   un agente apagado no se enruta aunque la palabra clave case).
2. **Workflow** — acciones compuestas (por ejemplo, una limpieza o una
   auditoría integral) que avanzan por pasos; de ahí el medidor de
   `chat:progress`.
3. **Entrevista de configuración** — cuando el proyecto está pendiente
   (ver arriba).

El chip visual del mensaje es **"el primer agente que participó de
verdad"** — orientación del operador, no decoración.

Y una pieza especial que merece nota propia: **si el resultado del turno
es una auditoría integral, el chat FIJA la calidad general del proyecto**
(las 6 dimensiones de [SCAN](SCAN.md) se persisten y la tarjeta del
proyecto se actualiza). Una conversación puede actualizar el score sin
pasar por la vista de escaneo — con la misma regla de score honesto.

## Persistencia de la conversación

Cada turno (usuario y asistente) se persiste por proyecto con rol,
contenido, agente del chip, modo y motor usados, y timestamp. La
conversación se reconstruye ordenada por fecha. El COSTE no vive aquí: la
factura real de cada corrida (tokens de entrada/salida/cachés, duración,
coste) va a la telemetría de corridas. Tablas y columnas:
[DATA-MODEL](../DATA-MODEL.md).

## Salvaguardas

- **Guardia de corrida** en el envío: una corrida por proyecto; lo costoso
  no se apila.
- **Confianza:** el modo autónomo exige proyecto confiable; sin él,
  supervisado forzoso.
- **Degradación por petición** sobre áreas protegidas (ver arriba).
- **Bloqueo autoritativo** de proyectos sin configurar, válido en
  autónomo.
- **Aislamiento por proyecto:** historial, telemetría y cwd separados; el
  chat de un proyecto no ve el de otro.
- **La API key** jamás cruza al renderer; las llamadas salen del proceso
  principal.

## Trazabilidad

```sql
-- Ultimos turnos de un proyecto (rol, chip, modo y motor por mensaje)
SELECT role, agent_id, mode, engine, created_at
FROM chat_messages WHERE project_id = ?
ORDER BY created_at DESC LIMIT 20;

-- Factura real de las corridas de chat de un proyecto
SELECT agent_id, input_tokens + output_tokens AS tokens, cost_usd, at
FROM agent_runs WHERE project_id = ? AND kind = 'chat'
ORDER BY at DESC LIMIT 20;
```

## Referencias

- [AGENTS](../AGENTS.md) — el catálogo que el router despacha y la carta
  compartida.
- [IPC](../IPC.md) — contratos de `chat:*` y el patrón de cierre por
  Promise.
- [DATA-MODEL](../DATA-MODEL.md) — chat_messages y agent_runs.
- [FLOWS/SCAN](SCAN.md) — el despacho por toggles (contraste con el
  router) y las 6 dimensiones que persistQuality alimenta.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — marco de amenazas.
- [PRINCIPLES](../PRINCIPLES.md) — principios 5 (kill de grupo) y 6
  (datos vs metadatos).
