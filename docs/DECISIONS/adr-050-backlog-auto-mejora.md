# ADR-050: Backlog de auto-mejora con enrutamiento de observaciones

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Mientras los agentes trabajan en los proyectos del usuario, descubren cosas
sobre FORTRESS mismo: límites, bugs, gaps, oportunidades. Sin un lugar donde
recogerlas, esas observaciones se pierden entre sesiones — y con ellas, la
capacidad del sistema de aprender de su propio uso.

## Alternativas consideradas

- **Notas globales sin enrutamiento:** descartada — pierde el contexto de en
  qué proyecto y bajo qué circunstancia se detectó la observación.
- **Sin backlog formal:** descartada — las observaciones se evaporarían al
  cerrar la sesión; el sistema no acumularía su propia crítica.

## Decisión

Los agentes capturan bloques de observación mientras trabajan y se ENRUTAN:
lo que es del proyecto auditado va al proyecto; lo que es de FORTRESS mismo
va a un backlog propio (la vista de auto-mejora). Cada observación lleva su
tipo (bug, gap, limitación, oportunidad) y su origen. Es el sustrato del
que nacen después las capacidades.

## Consecuencias

### Positivas
- FORTRESS acumula crítica sobre sí misma con contexto de origen.
- El enrutamiento evita mezclar hallazgos del proyecto con los del sistema.

### Negativas
- Un backlog que crece necesita atención humana para no volverse ruido.

### Neutras
- Es el primer eslabón del sistema evolutivo, previo al ciclo de
  capacidades.

## Referencias

- [PAGES/auto-mejora](../PAGES/auto-mejora.md) — la vista del backlog.
- [DATA-MODEL](../DATA-MODEL.md) — la tabla de observaciones del sistema.
- [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md) — las capacidades que nacen
  del backlog.
