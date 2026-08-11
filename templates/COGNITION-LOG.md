<!-- TEMPLATE UNIVERSAL — Se distribuye a otros proyectos.
     NO documenta a FORTRESS mismo. Ver docs/ para la doc de FORTRESS. -->

# COGNITION-LOG — Cerebro Compartido del Proyecto
## Registro de Aprendizajes · Patrones · Extinción · Atención Focalizada
### Proyecto: [NOMBRE DEL PROYECTO]
### Iniciado: [FECHA DE INICIO]
### Clasificación: INTERNO · NO COMMITEAR

```
╔════════════════════════════════════════════════════════════════╗
║  ESTE ARCHIVO ES EL CEREBRO DEL PROYECTO.                    ║
║  Claude Code lo lee al entrar. Claude Chat lo consulta.       ║
║  Dreaming lo consolida entre sesiones.                        ║
║                                                               ║
║  NO COMMITEAR · NO PUSHEAR · Vive en raíz local.             ║
║  Incluir en .gitignore: COGNITION*.md                         ║
║                                                               ║
║  Si se pierde este archivo, se pierde la memoria              ║
║  acumulada del proyecto. BACKUP periódico recomendado.        ║
╚════════════════════════════════════════════════════════════════╝
```

---

## CÓMO USAR ESTE ARCHIVO

```
QUIÉN LO LEE:
  · Claude Code al iniciar sesión (automáticamente vía CLAUDE.md)
  · Claude Chat cuando le traes reportes para análisis
  · Dreaming al consolidar sesiones nocturnas
  · El operador humano para auditar aprendizajes

QUIÉN LO ESCRIBE:
  · Claude Code al finalizar cada sesión (reflexión)
  · Claude Code al detectar un patrón nuevo
  · Claude Code al crear una defensa permanente
  · Claude Code al verificar extinción de un patrón
  · El operador humano para agregar contexto que solo él conoce

REGLAS:
  · NUNCA borrar un registro. Solo marcar como EXTINTO.
  · NUNCA modificar un registro pasado. Solo agregar nuevos.
  · Cada registro tiene fecha, evidencia y estado.
  · Si un patrón EXTINTO reaparece → reabrir con nuevo registro.
```

---

## GENERACIÓN ACTUAL

```
Generación: 0 (baseline)
Fecha de inicio: [FECHA]
Total de patrones registrados: 0
  ACTIVE:    0
  MITIGATED: 0
  EXTINTO:   0
Reglas permanentes creadas: 0
Tasa de extinción: —
```

---

## MAPA DE ATENCIÓN

```
Última actualización: [FECHA]

ZONA                          PESO    RAZÓN
──────────────────────────────────────────────────────────────
(completar después del primer scan)

EJEMPLO DE CÓMO SE LLENA:
  src/auth/                   0.90    Maneja autenticación + 2 bugs previos
  src/api/routes/             0.85    Recibe input de usuario directo
  src/payments/               0.95    Datos financieros (siempre alto)
  src/services/               0.50    1 error corregido, estable
  src/utils/                  0.20    Sin errores en 90 días
  src/components/ui/          0.10    UI sin lógica sensible
```

---

## REGISTRO DE PATRONES

### Plantilla (copiar para cada patrón nuevo)

```
──────────────────────────────────────────────────────────────
## PTN-[AÑO]-[NÚMERO]: [Título descriptivo del patrón]

Estado: ACTIVE | MITIGATED | EXTINTO
Generación: [número]
Primera detección: [fecha]
Última detección: [fecha]
Veces detectado: [número]
Veces después del fix: [número]

### Detección
  Pilar: SENTINEL | GUARDIAN | HERMES | SHIELD
  Capa: [cuál]
  Severidad: CRITICAL | HIGH | MEDIUM | LOW
  Archivo(s): [rutas]
  Línea(s): [números]
  Descripción: [qué se encontró, con evidencia]

### Causa Raíz (5 Whys)
  Método: 5_WHYS | PATTERN | CORRELATION | LLM
  WHY 1: [por qué ocurrió]
  WHY 2: [por qué eso pasó]
  WHY 3: [por qué eso pasó]
  WHY 4: [por qué eso pasó]
  WHY 5: [causa raíz final]
  Confianza: [0.0 a 1.0]

### Prevención Implementada
  Regla creada: [nombre de la regla, ej: semgrep/no-hardcoded-keys]
  Test creado: [nombre del test, ej: test_no_secrets_in_source]
  Doc actualizada: [qué documento se actualizó]
  CLAUDE.md actualizado: [sí/no, qué se agregó]
  PR: [número del PR si aplica]

### Verificación de Extinción
  Día 7: [¿se repitió? sí/no]
  Día 14: [¿se repitió? sí/no]
  Día 30: [¿se repitió? sí/no]
  Veredicto: ACTIVE | MITIGATED | EXTINTO
  Fecha de cierre: [fecha o "pendiente"]

### Reflexión
  ¿Qué hice bien?: [texto]
  ¿Qué hice mal?: [texto]
  ¿Qué cambio para la próxima?: [acción concreta]
──────────────────────────────────────────────────────────────
```

---

## PATRONES REGISTRADOS

*(Los patrones se agregan aquí en orden cronológico.
 Nunca se borran. Solo se marcan como EXTINTO.)*

```
Aún no hay patrones registrados.
El primer scan de seguridad poblará esta sección.

Para iniciar, decirle a Claude Code:
  "Ejecuta FASE 1 del protocolo de limpieza (seguridad)
   y registra cada hallazgo como patrón en COGNITION-LOG.md"
```

---

## REGLAS PERMANENTES CREADAS

*(Cada vez que COGNITION crea una regla nueva, se registra aquí.
 Las reglas nunca se borran, solo se mejoran/subsumen.)*

```
REGLA                          TIPO       ORIGEN         ESTADO
──────────────────────────────────────────────────────────────
(se llena conforme se crean reglas)

EJEMPLO:
  no-hardcoded-secrets         Semgrep    PTN-2026-001   ACTIVA
  no-http-fetch                ESLint     PTN-2026-002   ACTIVA
  test-no-secrets-in-source    Test       PTN-2026-001   ACTIVA
  validate-all-endpoints       CLAUDE.md  PTN-2026-003   ACTIVA
```

---

## REFLEXIONES POR SESIÓN

*(Cada sesión de trabajo genera una reflexión.
 Dreaming las consolida semanalmente.)*

### Plantilla de Reflexión

```
──────────────────────────────────────────────────────────────
## SESIÓN [FECHA] · [PROYECTO]

Duración: [tiempo aproximado]
Tokens consumidos: [si se midió]
Tarea principal: [qué se hizo]

### Hallazgos
  · [lista de lo que se encontró]

### ¿Qué hice bien?
  · [lista]

### ¿Qué hice mal?
  · [lista]

### ¿Qué cambio para la próxima?
  · [acciones concretas]

### Attention Map: cambios
  · [qué zonas subieron/bajaron de peso y por qué]
──────────────────────────────────────────────────────────────
```

---

## CONSOLIDACIÓN DREAMING

*(Dreaming lee todas las reflexiones y genera un resumen semanal.
 Este resumen es lo primero que el agente lee en la siguiente sesión.)*

### Plantilla de Consolidación Semanal

```
──────────────────────────────────────────────────────────────
## SEMANA [FECHA INICIO] → [FECHA FIN]

### Resumen
  Sesiones: [número]
  Patrones nuevos: [número]
  Patrones extintos: [número]
  Reglas creadas: [número]
  FORTRESS Score: [score actual] (tendencia: ↑ mejorando / ↓ empeorando / → estable)

### Tendencias
  Tipo de error más frecuente: [cuál]
  Zona con más actividad: [cuál]
  Pilar que más atrapa: [cuál]

### Recomendaciones
  · [acciones sugeridas para la próxima semana]

### Conocimiento consolidado
  · [reglas nuevas que se confirmaron]
  · [patrones que se subsumieron]
  · [reflexiones que generaron acción]
──────────────────────────────────────────────────────────────
```

---

## PATRONES EXTINTOS (archivo histórico)

*(Patrones que llevan 30+ días sin reaparecer.
 Se mueven aquí para referencia pero ya no requieren vigilancia activa.
 Si reaparecen → se crea un nuevo PTN que referencia al original.)*

```
Aún no hay patrones extintos.
```

---

## MÉTRICAS ACUMULADAS

```
MÉTRICA                              ACTUAL    TARGET    ESTADO
─────────────────────────────────────────────────────────────────
Tasa de extinción (30 días)          —         >90%      —
Tasa de recurrencia post-fix         —         <5%       —
Tiempo promedio a extinción          —         <14 días  —
Reglas permanentes creadas           0         creciente —
Cobertura de attention map           0%        100%      —
Falsos positivos por debate          —         <10%      —
KB hits (matches con CVEs)           —         >30%      —
Tokens por sesión (con graph)        —         <50K      —
Cache hit rate del graph             —         >80%      —
Generación actual                    0         creciente —
FORTRESS Score                       —         ≥95       —
```

---

## INSTRUCCIONES PARA CLAUDE CODE

```
AL INICIAR SESIÓN:
  1. Leer este archivo COMPLETO antes de empezar cualquier tarea
  2. Consultar el Knowledge Graph (get_architecture, get_findings)
  3. Verificar el attention map → priorizar zonas de peso alto
  4. Revisar patrones ACTIVE y MITIGATED → vigilar que no reaparezcan
  5. Leer la última consolidación Dreaming para contexto reciente

AL DETECTAR UN ERROR:
  1. ¿Ya existe un patrón para esto? → buscar en COGNITION-LOG
  2. Si existe y está EXTINTO → reabrirlo como nuevo PTN referenciando el original
  3. Si existe y está ACTIVE → incrementar times_detected
  4. Si es nuevo → crear nuevo PTN con la plantilla

AL CREAR UN FIX:
  1. Registrar la regla creada en "REGLAS PERMANENTES CREADAS"
  2. Actualizar el patrón con la prevención implementada
  3. Iniciar monitoreo de extinción (7/14/30 días)

AL FINALIZAR SESIÓN:
  1. Escribir reflexión con la plantilla
  2. Actualizar métricas acumuladas
  3. Actualizar attention map si hubo cambios
  4. Incrementar generación si se crearon reglas nuevas
```

---

```
COGNITION-LOG · Cerebro Compartido · v1.0
Plantilla Universal · Aplicable a cualquier proyecto
Alimentado por: Claude Code + Claude Chat + Dreaming

NO COMMITEAR · NO PUSHEAR
Vive en la raíz local del operador
Incluir en .gitignore: COGNITION*.md
Hacer BACKUP periódico — perder este archivo = perder la memoria
```
