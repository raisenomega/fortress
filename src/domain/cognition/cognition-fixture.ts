/**
 * Extracto literal de COGNITION-LOG.md tal y como se distribuye: plantillas,
 * ejemplos y marcadores sin rellenar. Es el estado real de un proyecto que
 * todavia no ha registrado nada, y es donde un parser ingenuo se inventa
 * datos. Copiado del archivo, no reconstruido de memoria.
 */
export const PLANTILLA = `## GENERACIÓN ACTUAL

\`\`\`
Generación: 0 (baseline)
Fecha de inicio: [FECHA]
Total de patrones registrados: 0
  ACTIVE:    0
  MITIGATED: 0
  EXTINTO:   0
Tasa de extinción: —
\`\`\`

---

## MAPA DE ATENCIÓN

\`\`\`
Última actualización: [FECHA]

ZONA                          PESO    RAZÓN
──────────────────────────────────────────────────────────────
(completar después del primer scan)

EJEMPLO DE CÓMO SE LLENA:
  src/auth/                   0.90    Maneja autenticación + 2 bugs previos
  src/api/routes/             0.85    Recibe input de usuario directo
  src/payments/               0.95    Datos financieros (siempre alto)
\`\`\`

---

## REGISTRO DE PATRONES

### Plantilla (copiar para cada patrón nuevo)

\`\`\`
## PTN-[AÑO]-[NÚMERO]: [Título descriptivo del patrón]

Estado: ACTIVE | MITIGATED | EXTINTO
Severidad: CRITICAL | HIGH | MEDIUM | LOW
\`\`\`

---

## PATRONES REGISTRADOS

\`\`\`
Aún no hay patrones registrados.
\`\`\`

---

## REFLEXIONES POR SESIÓN

### Plantilla de Reflexión

\`\`\`
## SESIÓN [FECHA] · [PROYECTO]

Duración: [tiempo aproximado]
\`\`\`
`
