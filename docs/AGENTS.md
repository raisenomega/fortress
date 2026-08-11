# Agentes y actores del sistema

FORTRESS involucra dos familias de agentes automatizados con dominios
distintos. Los actores del MOTOR participan en el flujo de auto-reparación
disciplinada de hallazgos. Los agentes de AUDITORÍA escanean proyectos para
detectar hallazgos y responden consultas del operador. Este documento
describe ambas familias.

## Distinción importante

| Familia | Cantidad | Dominio | Ejemplos |
|---|---|---|---|
| Motor | 4 (3 LLM + 1 mecánico) | Flujo de auto-reparación | claude-analyst, claude-generator, claude-omega, gate |
| Auditoría | 11 | Escaneo y consulta | Security Reviewer, Code Reviewer, Sentinel Omega |

Nota para evitar la confusión clásica: **Sentinel Omega es agente de
auditoría; claude-omega es el revisor del motor.** Nombres parecidos por
razones históricas — dominios, propósitos e implementaciones distintas.
Sentinel Omega audita al SISTEMA; claude-omega revisa DIFFS del motor.

## Familia 1 — Agentes y actores del motor de auto-reparación

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
- **Salida esperada:** análisis estructurado — veredicto (REAL u
  OBSOLETO), qué cambiar, dónde, patrón a copiar, qué no tocar y riesgo.
- **Timeout:** no tiene timeout propio en el spawn (los eslabones
  posteriores sí tienen timeout estricto).
- **Presupuesto:** es el primer gasto de la propuesta, sin reserva previa;
  las reservas protegen a los eslabones SIGUIENTES.
- **Registro en el libro:** evento AGENT_RUN con actor `claude-analyst`,
  coste real y duración; el análisis viaja como evidencia.
- **Prompt base:** no se reproduce. Intención: analizar sin arreglar,
  verificar REAL u OBSOLETO contra el archivo real, devolver JSON inerte.

### claude-generator

- **Fase:** generar (el tercer eslabón).
- **Propósito:** producir el fix mínimo que ataca lo que el análisis
  identificó.
- **Permisos:** el ÚNICO agente del motor que edita — modo de edición
  aceptada, con lectura más Edit/Write. **Sin shell a propósito:** el
  commit y el gate son del motor. La correa la verifica el motor sobre el
  diff real, no el agente.
- **Directorio de trabajo:** el worktree aislado de la propuesta.
- **Salida esperada:** ediciones en el worktree; el motor las lee con git
  como diff contra el `base_sha`.
- **Timeout:** 15 minutos.
- **Presupuesto:** spawn condicionado a una reserva de 200.000 tokens.
- **Registro en el libro:** AGENT_RUN con actor `claude-generator`.
- **Prompt base:** no se reproduce. Intención: fix mínimo según el
  análisis, solo dentro de la correa, sin ampliar alcance.

### claude-omega

- **Fase:** revisor semántico (el quinto eslabón, tras el gate).
- **Propósito:** juzgar si el fix RESUELVE el hallazgo con calidad, sin
  daño colateral y sin ampliar superficie de ataque.
- **Permisos:** lectura ESTRICTA — grafo más Read/Grep/Glob; sin edición,
  sin shell.
- **Contexto que recibe:** el análisis original, el diff completo y los
  archivos antes y después; metadatos sanitizados, código intacto entre
  delimitadores ([PRINCIPLES](PRINCIPLES.md), principio 6).
- **Salida esperada:** seis ejes más razón; el motor recomputa el
  veredicto global (principio 10).
- **Timeout:** 15 minutos, con terminación de GRUPO de procesos y escalada
  (principio 5).
- **Presupuesto:** spawn condicionado a la reserva del revisor (300.000
  tokens).
- **Registro en el libro:** AGENT_RUN con actor `omega` (etiqueta corta de
  telemetría; el agente es claude-omega).
- **Prompt base:** no se reproduce. Intención: puntuar los seis ejes con
  evidencia; el veto solo por las cuatro vías duras.

### gate (runner mecánico)

- **Fase:** gate hermético (entre generar y revisar).
- **Comandos, en orden fijo, dentro del worktree:** `npm ci` (timeout 15
  minutos), `npm run typecheck`, `npm run lint`, `npm run test:unit`
  (timeout 10 minutos cada uno).
- **Aislamiento:** instalación fresca en el worktree, sin reusar los
  node_modules del proyecto vivo.
- **Cola serial:** un solo juicio a la vez a nivel de proceso (compartida
  con el revisor).
- **Registro en el libro:** un AGENT_RUN por comando con actor `gate`,
  código de salida, duración y los últimos 2000 caracteres de stdout y
  stderr.
- **No consume tokens.** No interpreta texto: no es superficie de prompt
  injection.

El flujo end-to-end de estos 4 actores se documenta en
[FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).

## Familia 2 — Agentes de auditoría del sistema

Los 11 agentes de auditoría son especialistas en dominios de calidad,
seguridad y correctitud. Cada uno aporta hallazgos con evidencia al
expediente del proyecto, o responde en el chat cuando la intención del
operador lo invoca.

**Arquitectura real: catálogo de datos con generador común de prompts.**
No hay un archivo de configuración por agente: cada agente es una entrada
de datos (identificador, icono semántico, nombre, propósito, activo por
defecto, y opcionalmente una carta propia), y un generador único construye
el prompt de cada uno a partir de esos datos más una carta compartida. La
identidad que el operador ve en la barra lateral y la que el agente recibe
en su prompt son LA MISMA por construcción — no pueden divergir.

### Cómo se despachan — dos modos

- **Modo escaneo:** los toggles de la barra lateral activan o desactivan
  cada agente. El escaneo despacha exactamente los que están ON. Los
  toggles EXCLUYEN y no tienen cascade: activar uno no activa ni desactiva
  a ningún otro; cada agente decide de forma independiente si aporta.
- **Modo chat:** un router por palabras clave elige el agente según la
  intención del mensaje del operador ("revisa la seguridad" invoca al
  revisor de seguridad, "el build falla" al resolutor de builds).

En ambos modos, los agentes activos viajan a Claude Code como subagentes
(payload de identificador → descripción + prompt, con la forma exacta que
el CLI espera). **No hay timeout ni lista de herramientas por agente:** los
subagentes heredan el marco de la corrida completa (chat o escaneo) — su
allowlist, sus permisos y su límite de tiempo.

### Carta compartida (los 10 especialistas)

Diez de los once agentes no tienen prompt propio: su prompt se deriva de su
nombre y propósito más un código de conducta compartido, cuyas reglas —
descritas por intención — son:

1. Todo hallazgo lleva archivo, línea, severidad, impacto y fix propuesto.
2. Evidencia siempre: nada de "podría haber un problema" sin señalar dónde.
3. Honestidad en ambas direcciones: si algo está bien, se dice; no se
   inventan problemas para justificar el trabajo.
4. Zonas críticas (auth, pagos, seguridad) no se tocan sin explicar el
   impacto antes; un fix pequeño y seguro vale más que un refactor grande.

### Los 11 agentes

Formato: dominio · cuándo se activa · salida esperada. El registro de
telemetría es común (ver Trazabilidad).

#### Security Reviewer (`security-reviewer`)

- **Dominio:** secrets hardcodeados, inyecciones, autenticación, headers y
  rate limiting.
- **Cuándo se activa:** ON por defecto; escaneos y consultas de seguridad.
- **Salida esperada:** hallazgos de seguridad con severidad (los CRITICAL
  bloquean el push).

#### Code Reviewer (`code-reviewer`)

- **Dominio:** bugs, errores no manejados, edge cases.
- **Cuándo se activa:** ON por defecto; escaneos y "busca bugs".
- **Salida esperada:** hallazgos de correctitud con evidencia.

#### Refactor Cleaner (`refactor-cleaner`)

- **Dominio:** código muerto, imports sin usar, duplicación.
- **Cuándo se activa:** ON por defecto; escaneos y limpiezas.
- **Salida esperada:** hallazgos de higiene, típicamente MEDIUM/LOW.

#### TDD Guide (`tdd-guide`)

- **Dominio:** tests que reproducen el bug ANTES del fix.
- **Cuándo se activa:** ON por defecto; acompaña arreglos.
- **Salida esperada:** tests propuestos y brechas de cobertura.

#### Planner (`planner`)

- **Dominio:** planificación de features y evaluación de impacto antes de
  tocar código.
- **Cuándo se activa:** ON por defecto; "planifica esta feature".
- **Salida esperada:** plan por pasos con archivos afectados y riesgos.

#### Cognition (`cognition`)

- **Dominio:** patrones aprendidos y reflexiones por sesión.
- **Cuándo se activa:** ON por defecto; post-escaneo y "¿qué aprendimos?".
- **Salida esperada:** patrones con causa raíz y prevención, hacia el
  COGNITION-LOG del proyecto.

#### Build Error Resolver (`build-error-resolver`)

- **Dominio:** diagnóstico y arreglo de fallos de build.
- **Cuándo se activa:** OFF por defecto; se enciende cuando el build falla.
- **Salida esperada:** diagnóstico del fallo y fix mínimo propuesto.

#### E2E Runner (`e2e-runner`)

- **Dominio:** ejecución de tests end-to-end y verificación de flujos
  completos.
- **Cuándo se activa:** OFF por defecto.
- **Salida esperada:** resultado de flujos con evidencia de fallos.

#### Code Simplifier (`code-simplifier`)

- **Dominio:** reducción de complejidad sin cambiar comportamiento.
- **Cuándo se activa:** OFF por defecto; "simplifica esta función".
- **Salida esperada:** propuestas de simplificación equivalentes.

#### Opensource Sanitizer (`opensource-sanitizer`)

- **Dominio:** preparar el repo para publicarse sin filtrar nada.
- **Cuándo se activa:** OFF por defecto; "vamos a publicar".
- **Salida esperada:** inventario de material sensible y plan de limpieza.

#### Sentinel Omega (`sentinel-omega`) — carta propia

El undécimo agente es la excepción: el único con carta propia, porque su
identidad no la capturan las reglas comunes. Es el META-AUDITOR: contrasta
lo que reportan los demás agentes contra el filesystem real.

Los cuatro pilares de su carta (descritos por intención):

- **Testigo-no-actor:** observa, verifica y puede VETAR; nunca modifica
  código ni ejecuta acciones correctivas. En cuanto "arregla" o "aprueba
  solo", deja de ser testigo fiable.
- **Evidencia-o-silencio:** cada afirmación lleva archivo:línea comprobable
  contra el filesystem; sin prueba, no se afirma — el puntaje es nulo, no
  un número inventado.
- **Discrepancia-no-intención:** reporta lo que difiere entre lo declarado
  y lo real; jamás infiere motivos (la intención no se puede probar, y
  afirmarla sería fabricar evidencia).
- **Falible-por-diseño:** sus juicios se re-ejecutan y auditan; su registro
  (el Libro de la Vida) es append-only y sobrevive al proyecto.

Y una regla operativa dura de su carta: **grafo-primero, no negociable** —
navega el código por el Knowledge Graph y abre archivos enteros solo si el
grafo no basta.

- **Cuándo se activa:** ON por defecto; post-escaneo y bajo demanda.
- **Salida esperada:** vetos respaldados por evidencia (incluido el bloqueo
  de push por CRITICAL) y asientos en su registro eterno.
- **NO confundir con claude-omega** (revisor de diffs del motor).

## Ciclo de vida común de todos los agentes

- Todos los agentes LLM consumen tokens (el gate mecánico no).
- Toda corrida queda registrada: las del motor en el libro de vida de su
  propuesta; las de auditoría y chat en la telemetría de corridas, con su
  factura real (entrada, salida, cachés, coste y duración).
- Todos operan bajo el marco de [SECURITY-MODEL](SECURITY-MODEL.md).
- Todos son activables y desactivables por el operador.

## Configuración y toggle

- Panel lateral: toggle por agente, persistido.
- Un agente desactivado NO se despacha, aunque un flujo lo incluyera.
- Los toggles son independientes entre sí (sin cascade).
- Los agentes auto-creados por el ciclo de capacidades son una categoría
  aparte (datos en la base, firma humana previa, toggle reversible) — ver
  [DATA-MODEL](DATA-MODEL.md), tabla de definiciones de agentes.

## Trazabilidad

Los agentes de auditoría se asientan en la telemetría de corridas
(`agent_runs`, con `agent_id`); los actores del motor, en el libro de vida
(`proposal_events`, con `actor`). Consultas locales de diagnóstico:

```sql
-- Corridas recientes de un agente de auditoria, con su factura
SELECT at, kind, input_tokens + output_tokens AS tokens, duration_ms, failed
FROM agent_runs WHERE agent_id = 'security-reviewer'
ORDER BY at DESC LIMIT 20;

-- Agentes que corrieron en los escaneos recientes de un proyecto
SELECT DISTINCT agent_id FROM agent_runs
WHERE project_id = ? AND kind = 'scan' AND at >= ?;
```

## Salvaguardas de seguridad

- Los 11 de auditoría operan bajo el mismo modelo de amenazas que el resto
  del sistema; la auto-ejecución exige proyecto confiable (Workspace
  Trust).
- Sentinel Omega es solo lectura por diseño (testigo-no-actor).
- Prompt injection: los metadatos de hallazgos se sanitizan; el código
  bajo revisión no ([PRINCIPLES](PRINCIPLES.md), principio 6).
- El escáner nunca se autoverifica: auditar es mirar.

## Referencias

- [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) — la familia 1 en acción.
- `docs/FLOWS/SCAN.md` (por completar) — la familia 2 en acción.
- [SECURITY-MODEL](SECURITY-MODEL.md) — el modelo de amenazas.
- [GLOSSARY](GLOSSARY.md) — términos de ambas familias.
- [DATA-MODEL](DATA-MODEL.md) — agent_runs, proposal_events y las
  definiciones de agentes auto-creados.
- [PRINCIPLES](PRINCIPLES.md) — principios 6 y 10 (y el futuro registro
  formal de "al agente no se le cree por fe").
