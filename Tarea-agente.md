# Tarea-agente.md — Auditoría integral de FORTRESS (medición de tokens)

## Objetivo
Ejecutar una **auditoría/limpieza completa** del proyecto en el que estás
(`fortress-command-center`, tu directorio de trabajo actual), de forma que
**intervenga cada especialidad**. El fin es medir el **consumo real de tokens**
con todos los agentes trabajando. No es velocidad, es cobertura y precisión.

## Reglas que no se negocian
- **No rompas lo que funciona.** Antes de proponer un cambio, mira los tests que
  lo cubren. Si tocas algo, corre `npm run typecheck`, `npm run lint` y
  `npm run test:unit` (los tienes permitidos) y arregla lo que salga en rojo.
- **Evidencia siempre:** cada hallazgo lleva `archivo:línea`, severidad, impacto
  y fix propuesto. Nada de "podría haber un problema" sin señalar dónde.
- **Máximo 75 líneas por archivo, 50 por función.** Si algo crece, se divide.
- **No toques** auth, pagos, RLS ni seguridad sin explicar el impacto antes.
  (Este proyecto es local y no tiene esas áreas, pero la regla se respeta.)
- **Un fix pequeño y seguro** vale más que un refactor grande y arriesgado.

## Fases (cada una es el trabajo de un agente distinto)

### Fase 1 — Seguridad (Security Reviewer)
Secrets hardcodeados, inyecciones, XSS, deserialización insegura, path
traversal, CORS/CSP, headers, rate limiting. Reporta por severidad.

### Fase 2 — Bugs y errores (Code Reviewer)
Errores no manejados, promises sin await, null/undefined sin verificar,
comparaciones incorrectas, edge cases. Cada bug con su reproducción.

### Fase 3 — Código muerto y basura (Refactor Cleaner)
Funciones que nadie llama, imports sin usar, variables muertas, código
comentado, duplicación. Confirma que es safe-to-delete antes de proponer borrar.

### Fase 4 — Simplificación (Code Simplifier)
Funciones demasiado complejas o largas, anidamiento excesivo. Reduce complejidad
sin cambiar comportamiento; nombra qué test lo garantiza.

### Fase 5 — Tests (TDD Guide + E2E Runner)
Zonas sin cobertura, bugs sin test que los reproduzca. Propón (o escribe) los
tests que faltan. E2E: verifica que los flujos completos siguen pasando.

### Fase 6 — Build (Build Error Resolver)
Comprueba que `npm run build:linux` y `npm run typecheck` están limpios;
diagnostica cualquier fallo de build con causa raíz.

### Fase 7 — Planificación (Planner)
Con todo lo anterior, propón un plan priorizado: qué arreglar primero, qué
riesgo tiene cada fix, qué archivos afecta. No ejecutes el plan, solo diséñalo.

### Fase 8 — Publicación (Opensource Sanitizer)
¿Qué habría que limpiar antes de publicar este repo? Secrets, rutas locales,
docs internos, archivos que no deberían viajar.

### Fase 9 — Cognition
Resume los patrones aprendidos en esta auditoría: qué se repite, qué zona
concentra el riesgo, qué vigilar la próxima vez.

### Fase 10 — Verificación (SENTINEL OMEGA)
Contrasta cada hallazgo de las fases anteriores contra el filesystem real: ¿el
`archivo:línea` reportado existe? Marca las discrepancias (falsos positivos) con
evidencia. No juzgues intención, solo lo verificable.

## Entregable
Un **reporte consolidado** por severidad y por fase, y al final una línea con el
**total de tokens y coste** que reportó cada ejecución (para la medición). Marca
qué se corrigió, qué queda pendiente y qué requiere decisión humana.
