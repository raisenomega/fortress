# Agentes y actores del motor

El motor de auto-reparación involucra cuatro actores automatizados. Tres son
agentes LLM que razonan: consumen tokens, tienen prompts, emiten juicios.
Uno es un runner mecánico que ejecuta comandos deterministas: no consume
tokens, no tiene juicio semántico, emite códigos de salida. Presentarlos
como simétricos daría una imagen falsa; este documento los distingue a
propósito.

Nota de alcance: el sistema de auditoría de FORTRESS tiene además 11
agentes LLM propios (Security Reviewer, Code Reviewer, Sentinel OMEGA,
etc.). Son otros actores, con otra estructura, y se documentarán en su
propia sección de este archivo en una fase posterior.

## Distinción importante

| Actor | Tipo | Consume tokens | Emite juicio semántico |
|---|---|---|---|
| claude-analyst | Agente LLM | Sí | Sí (REAL / OBSOLETO) |
| claude-generator | Agente LLM | Sí | No (produce diff, no juicio) |
| claude-omega | Agente LLM | Sí | Sí (6 ejes + veredicto) |
| gate | Runner mecánico | No | No (códigos de salida) |

Los cuatro comparten un principio: **al agente no se le cree por fe.** El
coste en tokens sale de la factura real reportada por la herramienta (y si
no se puede leer, queda vacío — no se inventan números); los archivos
tocados los detecta el motor con git, no el reporte del agente; el
veredicto global del revisor lo recomputa el motor desde los ejes.

## Agentes LLM del motor

### claude-analyst

- **Fase:** entender (el segundo eslabón del flujo).
- **Propósito:** verificar que el hallazgo elegido sigue siendo real contra
  el código VIVO — no solo contra el grafo — y producir el análisis
  estructurado que servirá de correa para el generador.
- **Permisos:** solo lectura. Sus herramientas son las de consulta del
  grafo más lectura de archivos (Read/Grep/Glob); no tiene edición ni
  shell. La configuración del grafo va aislada: el agente no ve otros
  servidores MCP del entorno.
- **Directorio de trabajo:** la carpeta del proyecto analizado.
- **Contexto que recibe:** el hallazgo (severidad, título, archivo, línea)
  y la instrucción de verificar primero por grafo, después contra el
  archivo real.
- **Salida esperada:** análisis estructurado — veredicto (REAL u
  OBSOLETO), qué cambiar, dónde, patrón a copiar, qué no tocar y riesgo.
- **Timeout:** no tiene timeout propio en el spawn (el operador ve la
  corrida en curso y puede detenerla; los eslabones posteriores sí tienen
  timeout estricto).
- **Presupuesto:** es el primer gasto de la propuesta, no tiene reserva
  previa; las reservas protegen a los eslabones SIGUIENTES (ver abajo).
- **Registro en el libro:** evento AGENT_RUN con actor `claude-analyst`,
  coste real en tokens y duración; el análisis completo viaja como
  evidencia de la transición.
- **Prompt base:** no se reproduce públicamente (evitar drift entre
  documento y código, y no regalar la plantilla). Su intención: analizar
  sin arreglar, verificar REAL u OBSOLETO contra el archivo real, y
  devolver un JSON inerte con el entendimiento.

### claude-generator

- **Fase:** generar (el tercer eslabón).
- **Propósito:** producir el fix mínimo que ataca lo que el análisis
  identificó.
- **Permisos:** el ÚNICO agente del motor que edita — modo de edición
  aceptada, con herramientas de lectura más Edit/Write. **Sin shell a
  propósito:** el generador no corre git ni tests; el commit y el gate son
  del motor. La correa de archivos permitidos la verifica el motor sobre el
  diff real, no el agente.
- **Directorio de trabajo:** el worktree aislado de la propuesta (nunca el
  árbol vivo).
- **Contexto que recibe:** el análisis del eslabón anterior y la correa.
- **Salida esperada:** ediciones en el worktree. El motor las lee con git
  como diff contra el `base_sha` — los archivos tocados no se le creen al
  agente.
- **Timeout:** 15 minutos; al excederlo, el proceso se mata.
- **Presupuesto:** el spawn solo procede si quedan al menos 200.000 tokens
  del presupuesto de la propuesta (reserva del generador).
- **Registro en el libro:** AGENT_RUN con actor `claude-generator`, coste y
  duración; el commit resultante y el diff quedan referenciados en la
  evidencia.
- **Prompt base:** no se reproduce. Intención: fix mínimo según el
  análisis, solo dentro de la correa, sin ampliar alcance.

### claude-omega

- **Fase:** revisor semántico (el quinto eslabón, tras el gate).
- **Propósito:** juzgar si el fix RESUELVE el hallazgo con calidad, sin
  daño colateral y sin ampliar superficie de ataque. El gate prueba que
  compila; el revisor juzga que arregla.
- **Permisos:** lectura ESTRICTA — consulta de grafo más Read/Grep/Glob;
  sin edición, sin shell.
- **Directorio de trabajo:** el worktree de la propuesta (ve el estado
  post-fix; el pre-fix se le entrega como contexto).
- **Contexto que recibe:** el análisis original, el diff completo y los
  archivos afectados antes y después. Los METADATOS del hallazgo llegan
  sanitizados; el código y el diff van intactos entre delimitadores
  ([PRINCIPLES](PRINCIPLES.md), principio 6).
- **Salida esperada:** seis ejes — resuelve, alcance, intocable, calidad,
  riesgo, veredicto global — más razón textual.
- **Verificación cruzada:** el motor recomputa el veredicto global desde
  los ejes; ante discrepancia prevalece el cómputo del motor y queda
  asentado un evento DECISION.
- **Timeout:** 15 minutos, con terminación de GRUPO de procesos y
  escalada (el servidor de grafo hijo no queda vivo tras el kill —
  [PRINCIPLES](PRINCIPLES.md), principio 5).
- **Presupuesto:** el spawn solo procede si el gasto acumulado más la
  reserva del revisor (300.000 tokens) cabe en el presupuesto de la
  propuesta; si no, la propuesta se rechaza por presupuesto sin gastar
  más.
- **Registro en el libro:** AGENT_RUN con actor `omega` (etiqueta corta en
  la telemetría; el agente es el mismo claude-omega), coste y duración; el
  veredicto completo viaja como evidencia. Una respuesta no parseable
  rechaza por respuesta inválida — nunca se adivina un veredicto.
- **Prompt base:** no se reproduce. Intención: puntuar los seis ejes con
  evidencia contra el diff y el análisis; el veto solo procede por las
  cuatro vías duras.

## Actor no-LLM del motor

### gate (runner mecánico)

- **Fase:** gate hermético (entre generar y revisar).
- **Propósito:** ejecutar los mismos comandos que un humano correría para
  confiar en un cambio.
- **Comandos, en orden fijo, dentro del worktree:**
  1. `npm ci` — instalación limpia; timeout 15 minutos.
  2. `npm run typecheck` — timeout 10 minutos.
  3. `npm run lint` — timeout 10 minutos.
  4. `npm run test:unit` — timeout 10 minutos.
- **Aislamiento:** la instalación es fresca en el worktree, sin reusar los
  node_modules del proyecto vivo. Hermético por diseño.
- **Cola serial:** un solo juicio a la vez a nivel de proceso (cola
  compartida con el revisor): dos juicios nunca compiten por la máquina.
- **Registro en el libro:** un AGENT_RUN por comando con actor `gate`,
  código de salida, duración y los últimos 2000 caracteres de stdout y
  stderr para autopsia.
- **No consume tokens.** Un fallo del gate no gasta cuota de la API.
- **Salidas:** verde (pasa al revisor) o rechazo por comando fallido,
  timeout o instalación imposible.
- **No es superficie de prompt injection:** no interpreta texto; ejecuta
  comandos fijos con parámetros fijos.

## Ciclo de vida común (para los cuatro)

```
 Motor spawn -> Actor recibe input -> Actor ejecuta -> Motor lee output
    |                                                      |
    +------------- Emision al libro de vida <--------------+
                (AGENT_RUN con datos observables)
```

Los cuatro actores comparten el mismo protocolo de registro: un evento
AGENT_RUN tiene la misma forma sea del analista o del gate — cambian el
actor y, para los LLM, el coste en tokens. La emisión es telemetría, no
gate: si el libro falla, el motor sigue.

## Trazabilidad

Un ingeniero puede filtrar el libro por actor para reconstruir todo lo que
hizo un agente a lo largo de sus corridas (diagnóstico local; el libro
nunca sale del disco del usuario):

```sql
SELECT proposal_id, phase, cost_tokens, duration_ms, ts
FROM proposal_events
WHERE actor = 'claude-analyst' AND event_type = 'AGENT_RUN'
ORDER BY ts DESC LIMIT 20;
```

## Salvaguardas de seguridad relevantes

Cada agente LLM opera bajo el marco de [SECURITY-MODEL](SECURITY-MODEL.md).
Puntos específicos de esta página:

- El analista y el revisor son solo lectura: un prompt malicioso incrustado
  en un hallazgo no puede producir cambios al filesystem.
- El generador opera en worktree aislado con correa; tocar fuera de ella se
  detecta sobre el diff real y rechaza la propuesta.
- El gate no interpreta texto: comandos fijos, parámetros fijos.
- Los cuatro corren bajo la guardia de una-corrida-por-proyecto: dos
  corridas de agente sobre el mismo proyecto no compiten.

## Referencias

- [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) — el flujo end-to-end que
  encadena a los cuatro.
- [FLOWS/RETRY](FLOWS/RETRY.md) — cómo el reintento re-ejecuta el análisis
  fresco.
- [GLOSSARY](GLOSSARY.md) — términos de cada actor.
- [SECURITY-MODEL](SECURITY-MODEL.md) — el marco de amenazas.
- [PRINCIPLES](PRINCIPLES.md) — principios 5 (kill de grupo), 6 (datos vs
  metadatos) y 10 (veredictos recomputados).
- `docs/DATA-MODEL.md` (por completar) — la forma exacta de
  `proposal_events`.
