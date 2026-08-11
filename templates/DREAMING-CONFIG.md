<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# DREAMING-CONFIG — Configuración de Memoria Evolutiva
## Dreaming + Outcomes + Routines · Anthropic Oficial
### Versión 1.0 · Agosto 2026
### Aplicable a: cualquier proyecto con Claude Code

```
Las 3 features de Anthropic que hacen que COGNITION funcione
automáticamente sin intervención humana:

  DREAMING  → el cerebro que consolida entre sesiones
  OUTCOMES  → el evaluador que califica la calidad del trabajo
  ROUTINES  → los cron jobs que ejecutan tareas programadas

Las 3 son oficiales de Anthropic. No son de terceros.
Se configuran directamente en Claude Code.
```

---

## 1. DREAMING — MEMORIA EVOLUTIVA ENTRE SESIONES

### Qué es

Dreaming es un proceso programado de Anthropic que permite a Claude Code
revisar sus propias sesiones pasadas y consolidar aprendizajes.
Es como un cerebro que mientras "duerme" procesa lo que vivió durante
el día: elimina duplicados, resuelve contradicciones, extrae patrones,
y actualiza la memoria del proyecto.

Harvey (startup legal) reportó 6x mejora en tasa de completación
de tareas después de activar Dreaming.

### Qué hace concretamente

```
1. Lee hasta 100 sesiones pasadas de Claude Code en tu proyecto
2. Identifica patrones repetidos:
   "En las últimas 10 sesiones, el agente encontró 3 veces
    el mismo tipo de error en auth/"
3. Consolida conocimiento:
   · Elimina duplicados en CLAUDE.md
   · Resuelve contradicciones entre reglas
   · Extrae reglas nuevas de experiencias repetidas
4. Actualiza CLAUDE.md con las reglas aprendidas
5. La siguiente sesión de Claude Code hereda ese conocimiento
```

### Configuración

```bash
# Dreaming se configura como cron job dentro de Claude Code
# Se recomienda ejecutar durante horas de baja actividad

# Opción A: Dreaming como Routine (recomendado)
# Crear archivo: .claude/routines/dreaming.md

---
name: dreaming-nightly
schedule: "0 2 * * *"          # Todos los días a las 2:00 AM
description: Consolidación nocturna de conocimiento del proyecto
---

## Instrucciones para Dreaming

Revisa las sesiones de trabajo recientes de este proyecto.
Tu objetivo es consolidar el conocimiento acumulado.

Pasos:
1. Lee COGNITION-LOG.md completo
2. Lee CLAUDE.md completo
3. Identifica:
   · Reglas que se repiten o contradicen → unificar
   · Patrones detectados que no tienen regla permanente → crear regla
   · Patrones MITIGATED que se repitieron → la defensa no fue suficiente
   · Patrones ACTIVE que llevan más de 14 días → escalar prioridad
   · Reflexiones de sesiones que sugieren cambios concretos → implementar
4. Actualiza CLAUDE.md con reglas nuevas aprendidas
5. Actualiza COGNITION-LOG.md:
   · Marcar como EXTINTO patrones sin recurrencia en 30+ días
   · Incrementar generación si se crearon reglas nuevas
   · Actualizar métricas acumuladas
   · Escribir entrada en "Consolidación Dreaming" con resumen semanal
6. Actualizar attention map basado en actividad reciente
```

```bash
# Opción B: Dreaming manual (si no tienes Routines disponible)
# Ejecutar periódicamente en Claude Code:

"Ejecuta consolidación Dreaming:
 Lee COGNITION-LOG.md y CLAUDE.md.
 Identifica patrones repetidos, reglas duplicadas, y
 reflexiones que generan acción.
 Actualiza ambos archivos con el conocimiento consolidado.
 Marca como EXTINTO los patrones sin recurrencia en 30+ días.
 Genera el briefing semanal en COGNITION-LOG.md."
```

### Integración con COGNITION-LOG.md

```
DREAMING LEE:
  · Patrones ACTIVE y MITIGATED → verifica recurrencia
  · Reflexiones por sesión → extrae acciones concretas
  · Attention map → recalcula pesos con datos recientes
  · Métricas acumuladas → actualiza tendencias

DREAMING ESCRIBE:
  · Consolidación semanal → resumen en COGNITION-LOG.md
  · Reglas nuevas → en CLAUDE.md
  · Patrones EXTINTO → actualiza estado en COGNITION-LOG.md
  · Generación incrementada → registra en COGNITION-LOG.md
```

---

## 2. OUTCOMES — AUTO-EVALUACIÓN DE CALIDAD

### Qué es

Outcomes es un loop de auto-evaluación donde un agente evaluador
califica el trabajo contra una rúbrica escrita. Es como un examen
que el agente se hace a sí mismo después de cada tarea para verificar
que el resultado cumple los estándares definidos.

### Configuración

```bash
# Crear archivo: .claude/routines/outcomes-check.md

---
name: outcomes-quality-check
schedule: "0 6 * * 1"          # Lunes a las 6:00 AM
description: Evaluación semanal de calidad del trabajo del agente
---

## Rúbrica de Evaluación

Evalúa el trabajo de la última semana contra estos criterios.
Califica cada uno de 1 a 5 y calcula el score total.

### Criterio 1: Seguridad (peso: 30%)
  5 = Cero hallazgos CRITICAL/HIGH sin resolver
  4 = Todos los CRITICAL resueltos, algunos HIGH pendientes
  3 = CRITICALs resueltos pero con recurrencia
  2 = CRITICALs pendientes de más de 48h
  1 = CRITICALs ignorados o no detectados

### Criterio 2: Tests (peso: 25%)
  5 = 80%+ cobertura, todos pasando, tests de regresión para cada fix
  4 = 70%+ cobertura, todos pasando
  3 = Tests existen pero cobertura <70%
  2 = Tests existen pero algunos fallan
  1 = Sin tests o tests rotos ignorados

### Criterio 3: Código limpio (peso: 20%)
  5 = Cero código muerto, cero console.log, naming consistente
  4 = Mínimo código muerto, naming mayormente consistente
  3 = Algo de código muerto y console.log detectados
  2 = Código muerto significativo sin limpiar
  1 = Codebase desordenado sin mantenimiento

### Criterio 4: Cognition (peso: 15%)
  5 = Todos los patrones tienen regla, 90%+ extintos
  4 = Mayoría de patrones tienen regla, 70%+ extintos
  3 = Algunos patrones sin regla, 50%+ extintos
  2 = Muchos patrones sin regla ni seguimiento
  1 = COGNITION-LOG.md no se mantiene

### Criterio 5: Documentación (peso: 10%)
  5 = ARCHITECTURE.md, CLAUDE.md, COGNITION-LOG.md actualizados
  4 = Documentos existen y mayormente actualizados
  3 = Documentos existen pero desactualizados
  2 = Faltan documentos importantes
  1 = Sin documentación

### Cálculo del Score
  FORTRESS_QUALITY = (
    seguridad × 0.30 +
    tests × 0.25 +
    codigo_limpio × 0.20 +
    cognition × 0.15 +
    documentacion × 0.10
  ) × 20  → score de 0 a 100

### Acciones según score
  90-100: Excelente. Mantener ritmo.
  70-89:  Bueno. Identificar 1-2 áreas de mejora.
  50-69:  Aceptable. Priorizar mejoras esta semana.
  30-49:  Preocupante. Plan de acción inmediato.
  0-29:   Crítico. Detener features, focalizar en calidad.

## Output
Escribir resultado en COGNITION-LOG.md bajo "Consolidación Dreaming"
con el score, la calificación de cada criterio, y las acciones para
la siguiente semana.
```

---

## 3. ROUTINES — TAREAS PROGRAMADAS

### Qué son

Routines son tareas que Claude Code ejecuta automáticamente en
horarios definidos. Son el equivalente a cron jobs pero ejecutados
por el agente de IA con todo el contexto del proyecto.

### Routines recomendadas para FORTRESS

```bash
# Crear directorio de routines
mkdir -p .claude/routines
```

#### Routine 1: Scan de Seguridad Diario

```bash
# Archivo: .claude/routines/security-daily.md

---
name: security-daily-scan
schedule: "0 5 * * *"          # Todos los días a las 5:00 AM
description: Escaneo de seguridad diario automatizado
---

Ejecuta FASE 1 del protocolo de limpieza de CLAUDE.md:
1. Buscar secrets hardcodeados en todo el codebase
2. Verificar que no hay nuevas dependencias con CVEs
3. Verificar que los endpoints sensibles tienen auth
4. Si encuentras algo CRITICAL → generar alerta en FORTRESS-REPORT.md

Usar el Knowledge Graph para focalizar en zonas de atención alta.
NO abrir archivos que el graph ya tiene indexados.
Registrar hallazgos en COGNITION-LOG.md.
```

#### Routine 2: Limpieza Semanal

```bash
# Archivo: .claude/routines/cleanup-weekly.md

---
name: cleanup-weekly
schedule: "0 4 * * 1"          # Lunes a las 4:00 AM
description: Limpieza semanal de código muerto y basura
---

Ejecuta FASE 2 (código muerto) + FASE 4 (consistencia) de CLAUDE.md:
1. Consultar Knowledge Graph: buscar funciones con 0 callers
2. Identificar imports sin usar
3. Buscar console.log/print de debugging
4. Verificar naming consistency
5. Para cada hallazgo: verificar con graph que es safe-to-delete
6. Generar reporte en FORTRESS-REPORT.md
7. NO eliminar nada automáticamente — solo reportar

Registrar hallazgos en COGNITION-LOG.md.
```

#### Routine 3: Verificación de Dependencias

```bash
# Archivo: .claude/routines/deps-check.md

---
name: dependency-check
schedule: "0 5 * * 1"          # Lunes a las 5:00 AM
description: Escaneo semanal de dependencias por CVEs
---

Verificar todas las dependencias del proyecto:
1. Correr: npm audit (Node.js) / pip-audit (Python) / cargo audit (Rust)
2. Identificar dependencias con CVEs conocidos
3. Para cada CVE: determinar severidad y si hay fix disponible
4. Generar reporte con: paquete, versión actual, CVE, fix disponible
5. Si hay CRITICAL → marcar en FORTRESS-REPORT.md como blocker

Registrar en COGNITION-LOG.md si hay patrones de dependencias
que se repiten (ej: siempre la misma librería con CVEs).
```

#### Routine 4: Dreaming Nocturno (ya definido arriba)

```bash
# Archivo: .claude/routines/dreaming.md
# (contenido definido en la sección 1 de este documento)
```

#### Routine 5: Outcomes Semanal (ya definido arriba)

```bash
# Archivo: .claude/routines/outcomes-check.md
# (contenido definido en la sección 2 de este documento)
```

#### Routine 6: Re-indexar Knowledge Graph

```bash
# Archivo: .claude/routines/graph-reindex.md

---
name: graph-reindex
schedule: "0 3 * * *"          # Todos los días a las 3:00 AM
description: Re-indexar el Knowledge Graph para mantenerlo fresco
---

Re-indexar el Knowledge Graph del proyecto:
1. Ejecutar index_repository para actualizar nodos y relaciones
2. Verificar que el conteo de nodos/aristas es consistente
3. Si hay discrepancias grandes vs. la indexación anterior → alertar
4. Actualizar la sección "Knowledge Graph" de ARCHITECTURE.md
   con los nuevos conteos
```

---

## ESTRUCTURA DE ARCHIVOS

```
tu-proyecto/
├── .claude/
│   ├── agents/                       # Los 10 agentes seleccionados
│   │   ├── security-reviewer.md
│   │   ├── code-reviewer.md
│   │   ├── refactor-cleaner.md
│   │   ├── tdd-guide.md
│   │   ├── planner.md
│   │   ├── build-error-resolver.md
│   │   ├── e2e-runner.md
│   │   ├── code-simplifier.md
│   │   ├── opensource-sanitizer.md
│   │   └── cognition.md
│   │
│   └── routines/                     # Tareas programadas
│       ├── dreaming.md               # Consolidación nocturna (2 AM)
│       ├── security-daily.md         # Scan de seguridad (5 AM diario)
│       ├── cleanup-weekly.md         # Limpieza (4 AM lunes)
│       ├── deps-check.md             # Dependencias (5 AM lunes)
│       ├── outcomes-check.md         # Auto-evaluación (6 AM lunes)
│       └── graph-reindex.md          # Re-indexar graph (3 AM diario)
│
├── CLAUDE.md                         # Constitución
├── ARCHITECTURE.md                   # Blueprint
├── COGNITION-LOG.md                  # Cerebro (no commitear)
├── FORTRESS.md                       # Seguridad (no commitear)
├── COGNITION_DEEP.md                 # Motor cognitivo (no commitear)
└── FORTRESS-REPORT.md                # Último reporte (generado automático)
```

---

## CALENDARIO SEMANAL COMPLETO

```
HORA     LUN          MAR          MIÉ          JUE          VIE          SÁB/DOM
─────────────────────────────────────────────────────────────────────────────────
02:00    Dreaming     Dreaming     Dreaming     Dreaming     Dreaming     —
03:00    GraphReindex GraphReindex GraphReindex GraphReindex GraphReindex —
04:00    Cleanup      —            —            —            —            —
05:00    DepCheck     Security     Security     Security     Security     —
         Security
06:00    Outcomes     —            —            —            —            —

DURANTE EL DÍA (cuando el operador trabaja):
  · Claude Code activo con agentes
  · Cada sesión genera reflexión en COGNITION-LOG.md
  · /compact entre tareas

NOCHE (automático):
  · Dreaming consolida sesiones del día
  · Security scan busca cambios del día
  · Graph se re-indexa con los cambios del día

LUNES (día de mantenimiento):
  · Cleanup semanal (4 AM)
  · Dependency check (5 AM)
  · Outcomes quality check (6 AM)
  · El operador llega con reporte completo del estado del proyecto
```

---

## VERIFICACIÓN DE QUE FUNCIONA

```bash
# Dentro de Claude Code, verificar que las routines están activas:

# 1. Listar routines configuradas
ls .claude/routines/

# 2. Verificar que Claude Code las reconoce
"¿Qué routines tengo configuradas?"

# 3. Ejecutar una manualmente para probar
"Ejecuta la routine security-daily-scan ahora"

# 4. Verificar que Dreaming consolidó
"¿Cuál fue la última consolidación Dreaming en COGNITION-LOG.md?"

# 5. Verificar que Outcomes evaluó
"¿Cuál fue el último FORTRESS_QUALITY score?"
```

---

## NOTA IMPORTANTE SOBRE DISPONIBILIDAD

```
Dreaming, Outcomes y Routines son features de Anthropic en distintas
etapas de disponibilidad:

  · Dreaming:  anunciado mayo 2026, en Code with Claude
  · Outcomes:  anunciado mayo 2026, como parte del agentic loop
  · Routines:  feature de Claude Code para tareas programadas

Si alguna de estas features no está disponible en tu versión de
Claude Code, puedes replicar el comportamiento manualmente:

  · Dreaming manual: ejecutar el prompt de consolidación 1x/semana
  · Outcomes manual: ejecutar la rúbrica de evaluación 1x/semana
  · Routines manual: ejecutar los scans como cron jobs de bash
    con fortress-orchestrator.sh:

    # Ejemplo de cron manual:
    # Editar crontab: crontab -e
    0 5 * * * cd ~/project && claude --headless "Ejecuta security scan"
    0 4 * * 1 cd ~/project && claude --headless "Ejecuta cleanup semanal"

Los archivos .md de las routines funcionan como INSTRUCCIONES
para el agente independientemente de si hay soporte nativo de scheduling.
El operador puede ejecutarlas manualmente cuando quiera.
```

---

```
DREAMING-CONFIG · Memoria Evolutiva · v1.0
Dreaming + Outcomes + Routines · Anthropic Oficial
6 routines configuradas · Calendario semanal automatizado
Integrado con: CLAUDE.md · COGNITION-LOG.md · COGNITION_DEEP.md

NO COMMITEAR los archivos de routines que contengan
instrucciones de seguridad detalladas.
Los .md de routines pueden commitearse si solo contienen
instrucciones genéricas sin revelar estrategia de seguridad.
```
