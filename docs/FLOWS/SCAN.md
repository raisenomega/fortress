# Flujo: escaneo de proyectos

FORTRESS escanea proyectos configurados para detectar hallazgos con
evidencia y medir la calidad general en 6 dimensiones. El escaneo despacha
agentes de auditoría (familia 2 en [AGENTS](../AGENTS.md)), produce
hallazgos con identidad estable que PERSISTEN entre escaneos — la memoria
conservadora — y actualiza el score del proyecto puntuando el expediente
completo, no la corrida del día. Este documento describe el flujo
end-to-end y las reglas que lo hacen honesto.

## Dos tipos de escaneo

Coexisten a propósito, por dominios distintos (no son redundantes):

- **Escaneo de seguridad:** especialista en vulnerabilidades y superficie
  de ataque; alimenta el expediente de hallazgos y su historial propio.
- **Auditoría de calidad integral:** mide las 6 dimensiones de ingeniería y
  produce el score general; historial propio para graficar tendencia.

Las tablas de ambos historiales están en [DATA-MODEL](../DATA-MODEL.md).

## Diagrama del flujo

```
 Operador dispara escaneo (o el ciclo autonomo lo pide)
      |
      v
 [Preparacion: proyecto valido, agentes ON del catalogo]
      |
      v
 [Despacho: subagentes via --agents, cwd = carpeta del proyecto]
      |
      +--- cada agente aporta hallazgos con evidencia archivo:linea
      |
      v
 [Post-procesamiento del motor (determinista):]
      |
      +--- calcular identity y fingerprint por hallazgo
      +--- nuevos: primera aparicion, ciclo de vida ACTIVE
      +--- re-vistos: se refresca lo que pudo cambiar; first_seen NO se toca
      +--- ausentes: decidir extincion con DOBLE evidencia (ver abajo)
      |
      v
 [Score del EXPEDIENTE: reportados hoy + ACTIVE no nombrados]
      |
      v
 [Reescritura determinista del COGNITION-LOG del proyecto]
      |
      v
 Escaneo cerrado. La preparacion de push consulta los conteos:
 CRITICAL > 0 => push bloqueado (regla pura de dominio).
```

## Despacho de agentes

- Los agentes ON del catálogo viajan como subagentes (`--agents`); los
  toggles EXCLUYEN y no tienen cascade ([AGENTS](../AGENTS.md)).
- Cada agente opera bajo la carta compartida: evidencia obligatoria
  archivo:línea, no inventar problemas, honestidad en ambas direcciones.
- El escáner NUNCA se autoverifica: auditar es mirar.

## Identidad estable: dos claves, no una

Cada escaneo sustituye las filas reportadas — sin claves estables no habría
memoria ni descartes duraderos. El sistema usa DOS claves con propósitos
OPUESTOS, y la diferencia es deliberada:

### fingerprint — gobierna los descartes

Composición canónica: severidad, archivo, línea y título normalizado (en
minúsculas, espacios colapsados; la línea entra como guion si es nula).

- **Estricta a propósito.** El título entra en la huella: si el modelo
  reformula el texto, la huella cambia y el descarte NO se hereda — el
  hallazgo reaparece y hay que volver a descartarlo. Es molesto, y es el
  lado seguro: descartar por solo archivo y línea silenciaría cualquier
  problema futuro en esa misma línea.

### identity — gobierna la fila estable y la historia

Composición: severidad, archivo y título — SIN la línea.

- **Laxa a propósito.** La línea se mueve con cada edición; incluirla
  partiría la historia del hallazgo en cada commit. Con identity, el mismo
  problema conserva su fila (y su first_seen) aunque el archivo crezca.
- Usa LA MISMA regla que el identificador de patrón del COGNITION-LOG: la
  base y el registro cognitivo no pueden divergir sobre el mismo problema,
  por construcción.

Columnas y detalles de persistencia: [DATA-MODEL](../DATA-MODEL.md).

## Ciclo de vida de hallazgos

### lifecycle es ORTOGONAL a status

Dos ejes que registran cosas distintas y no se mezclan:

- **status** — la decisión del OPERADOR: abierto, o descartado como falso
  positivo. Registra qué hizo el humano.
- **lifecycle** — qué le pasa al PROBLEMA: ACTIVE, MITIGATED, EXTINCT.

"Descartado y ACTIVE" es una combinación legítima: el operador decidió que
ese reporte no le aplica, Y el patrón sigue presente en el código. Ejemplo
concreto: un hallazgo de rate-limiting descartado en un proyecto interno
sin usuarios externos — el operador lo silenció (status), pero el código no
cambió (lifecycle ACTIVE). Mezclar los ejes haría que descartar pareciera
arreglar.

### Los tres estados del problema

- **ACTIVE** — el problema está ahí, lo haya nombrado o no el último
  escaneo. Cuenta para el score. Elegible para el motor de auto-reparación
  si está en el debut.
- **MITIGATED** — hay un fix APLICADO y falta confirmar que ya no aparece.
  No significa "ausente sin evidencia".
- **EXTINCT** — ausencia confirmada con evidencia dura, no por una sola
  corrida. Queda como historia con su fecha de resolución; jamás se borra.

### La regla de extinción honesta (doble evidencia)

Para pasar a EXTINCT, un hallazgo ACTIVE debe cumplir LAS DOS:

1. **Ausente** del escaneo nuevo (por identity).
2. **Su archivo cambió** según git desde el first_seen del hallazgo.

A git solo se le pregunta por los ausentes — los reportados no piden
prueba. Y el ausente cuyo archivo NO cambió **sigue ACTIVE** (no baja ni a
MITIGATED): solo significa que el escáner no lo nombró esta vez.

Esta regla existe por evidencia dura, no por prevención abstracta: en una
corrida temprana (2026-08-08), cuatro hallazgos se extinguieron en falso
sin que sus archivos cambiaran un byte entre escaneos. Sin la doble
evidencia, el sistema tiende a matar hallazgos en falso — y un score que
mejora solo es la peor clase de bug.

## El score puntúa el EXPEDIENTE, no la corrida

Descubrimiento central del diseño, publicado tal cual lo guarda el código:
puntuar solo lo reportado hoy MENTÍA POR OMISIÓN — el tablero llegó a
mostrar 92 con un HIGH vivo en la base (el número real era 78). Desde
entonces, el score se computa sobre el expediente: los hallazgos
reportados hoy MÁS los ACTIVE que este escaneo no nombró y nadie arregló.
Es la misma regla que sigue el registro cognitivo: número y registro
cuentan la misma historia.

## Score de 6 dimensiones

Las seis, con sus pesos exactos (suman 100; parámetros de diseño
observables):

| Dimensión | Peso | Qué mide |
|---|---|---|
| Seguridad | 30 | Vulnerabilidades y superficie de ataque |
| Correctitud | 20 | Bugs, errores no manejados, edge cases |
| Tests | 15 | Cobertura y calidad de la verificación |
| Mantenibilidad | 15 | Higiene, duplicación, complejidad |
| Dependencias | 10 | Estado y riesgo de la cadena de suministro |
| Operación | 10 | Docs operativas, CI, configuración sana |

### Cómo se calculan y agregan

- Cada dimensión recibe hallazgos (penalización DECRECIENTE por severidad,
  con un hueco grande entre CRITICAL y HIGH que refleja prioridad
  operativa) o un score directo; el resultado va de 0 a 100.
- **Sin datos = null, y null NO cuenta como 100.** Un sistema que se pone
  100 en lo que no midió se está mintiendo.
- El **global es la media PONDERADA de las MEDIDAS**; si alguna dimensión
  quedó sin datos, el global se marca PARCIAL con la lista de faltantes.
- **Techo 64 con cualquier CRITICAL abierto** en una dimensión medida por
  hallazgos: una vulnerabilidad explotable no se diluye en un promedio.

## Push bloqueado por CRITICAL

Regla PURA de dominio, literal y determinista: si el último escaneo dejó
conteo de CRITICAL mayor que cero, el push queda bloqueado, con su razón
visible ("Hay CRITICAL sin resolver"). Se levanta resolviendo el hallazgo
(extinción honesta) o descartándolo explícitamente (decisión del operador
que queda registrada y sobrevive a re-escaneos).

Nota de precisión: este bloqueo NO es el "veto de Sentinel Omega" — son
mecanismos distintos. El veto de Sentinel opera sobre promociones del ciclo
de capacidades, con evidencia; el bloqueo de push es una regla de conteo
del dominio.

## Sentinel Omega en el flujo

Dos cosas distintas que conviene no confundir:

- **La reescritura post-escaneo del COGNITION-LOG es DETERMINISTA y no la
  hace un LLM:** el motor la ejecuta por un puerto de dominio al cerrar el
  escaneo (patrones al día, reflexión de la corrida). Ocurre siempre.
- **La auditoría de Sentinel Omega usa el agente** (con su carta:
  testigo-no-actor, evidencia-o-silencio, grafo-primero) y corre bajo
  demanda. Sentinel es toggleable como cualquier agente del catálogo — ON
  por defecto.

## Trazabilidad

Consultas locales de diagnóstico (columnas reales):

```sql
-- Ultimo escaneo de seguridad de un proyecto
SELECT score, finding_count, critical_count, duration_ms, at
FROM scans WHERE project_id = ? ORDER BY at DESC LIMIT 1;

-- Expediente vivo por severidad
SELECT severity, COUNT(*) FROM findings
WHERE project_id = ? AND status = 'open' AND lifecycle != 'EXTINCT'
GROUP BY severity;

-- Historia de un hallazgo (fila estable por identity)
SELECT first_seen, last_seen, lifecycle, resolved_at
FROM findings WHERE project_id = ? AND identity = ?;

-- Tendencia del score integral
SELECT global, partial, at FROM quality_scans
WHERE project_id = ? ORDER BY at DESC LIMIT 10;
```

## Salvaguardas

- Workspace Trust: la auto-ejecución exige proyecto confiable; sin
  confianza, nada se ejecuta solo.
- Aislamiento por proyecto: cada escaneo corre con cwd en SU carpeta; los
  datos viven separados por proyecto y borrar uno se lleva lo suyo.
- Prompt injection: los metadatos de hallazgos se sanitizan al entrar a
  prompts posteriores; el código no ([PRINCIPLES](../PRINCIPLES.md),
  principio 6).
- Cero telemetría externa: hallazgos, scores y registro cognitivo — todo
  local.

## Referencias

- [AGENTS](../AGENTS.md) — los 11 agentes de auditoría (familia 2) y su
  carta compartida.
- [DATA-MODEL](../DATA-MODEL.md) — findings (las dos claves y el paquete
  de memoria), scans, quality_scans, dismissals.
- [FLOWS/SELF-REPAIR](SELF-REPAIR.md) — qué pasa con un hallazgo elegible
  cuando el motor lo toma.
- [FLOWS/POSTURE](POSTURE.md) — la superficie externa es otro flujo.
- [PRINCIPLES](../PRINCIPLES.md) — principios 6 y 10; el score honesto por
  expediente nació como decisión de arquitectura
  ([ADR-001](../DECISIONS/adr-001-score-honesto-por-expediente-active.md)).
- [SECURITY-MODEL](../SECURITY-MODEL.md) — el modelo de amenazas del
  escaneo.
