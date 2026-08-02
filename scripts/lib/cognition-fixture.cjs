/**
 * COGNITION-LOG.md de verdad en disco, para que el panel tenga algo que leer
 * en el preview y en la integracion. Incluye a proposito el bloque de EJEMPLO
 * de la plantilla original: si el filtro de plantillas dejara de funcionar,
 * las capturas ensenarian zonas de atencion inventadas.
 */
const { mkdirSync, writeFileSync, rmSync } = require('fs')
const { join } = require('path')

const LOG = `# COGNITION-LOG

## GENERACIÓN ACTUAL

\`\`\`
Generación: 2
\`\`\`

## MAPA DE ATENCIÓN

\`\`\`
src/auth/          0.95    Maneja autenticación y tuvo 2 bugs previos
api/routes.py      0.85    Recibe input de usuario directo
src/utils/         0.20    Sin errores en 90 días

EJEMPLO DE CÓMO SE LLENA:
  inventado/         0.99    Esta linea NUNCA debe aparecer en la UI
\`\`\`

## PTN-2026-001: Secret hardcodeado en config.py

Estado: EXTINTO
Severidad: CRITICAL
Primera detección: 2026-07-01
Veces detectado: 3

## PTN-2026-002: Endpoint de login sin rate limiting

Estado: ACTIVE
Severidad: HIGH
Primera detección: 2026-07-28
Veces detectado: 1

## PTN-2026-003: Console.log con datos de sesion

Estado: MITIGATED
Severidad: MEDIUM
Veces detectado: 2

## SESIÓN 2026-08-01 · Nucleo

Tarea principal: FASE 1 de seguridad
Hallazgos: 2 CRITICAL, 5 HIGH
`

function writeCognitionLog(projectPath) {
  mkdirSync(projectPath, { recursive: true })
  writeFileSync(join(projectPath, 'COGNITION-LOG.md'), LOG)
  return projectPath
}

function removeCognitionLog(projectPath) {
  rmSync(projectPath, { recursive: true, force: true })
}

module.exports = { writeCognitionLog, removeCognitionLog }
