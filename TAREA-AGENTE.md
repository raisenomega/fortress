# TAREA-AGENTE.md — tarea activa para el agente

Trabajas dentro de `fortress-command-center` (tu directorio actual). Haz SOLO lo
que dice este archivo. No toques nada más. No es una charla: crea los archivos
y corre la verificación de verdad.

## Objetivo

Escribir los tests unitarios que faltan para dos funciones de dominio que hoy
no tienen cobertura. Nada de runtime, nada de auth, nada fuera de estos dos
archivos de test.

## Archivo 1 — `src/domain/posture/posture-score.test.ts`

Prueba `postureScore(findings)` de `./posture-score`. Cubre:

- Sin hallazgos → 100.
- Las penalizaciones por severidad: LOW resta 1, MEDIUM 3, HIGH 10, CRITICAL 25
  (mira el código para el valor exacto antes de afirmar; NO inventes números).
- Un solo CRITICAL deja el score en la banda de riesgo (techo 64), aunque el
  resto esté limpio.
- Nunca baja de 0 por muchos hallazgos que haya.
- Es determinista: los mismos hallazgos en distinto orden dan el mismo número.

## Archivo 2 — `src/domain/cognition/sections.test.ts`

Prueba `normalize`, `splitSections` y `findSection` de `./sections`. Cubre:

- `normalize` quita tildes y pasa a mayúsculas.
- `splitSections` parte un markdown por títulos de nivel dos (`## `) y separa
  encabezado de cuerpo.
- `findSection` encuentra por prefijo, ignorando tildes y mayúsculas, y
  devuelve null si no existe.

## Reglas

- Máximo 75 líneas por archivo. Un test por comportamiento, nombre claro.
- Lee el código real de cada función antes de escribir el test. Si un valor no
  coincide con lo que asumías, manda el test contra lo que dice el código.
- No modifiques `posture-score.ts` ni `sections.ts`: solo añades tests.

## Verificación (obligatoria, la puedes correr tú)

Al terminar, ejecuta:

```
npm run test:unit
```

Debe quedar en verde. Si algún test falla, corrígelo hasta que pase. No des la
tarea por hecha sin ver los tests pasar.

## Después (NO ahora)

Lo siguiente en la hoja de ruta es D3 (conectores MCP), registrado en
`Estado_fortress.md`. No lo empieces en esta tarea.
