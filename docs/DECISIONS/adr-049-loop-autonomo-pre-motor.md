# ADR-049: Loop autónomo pre-motor

**Estado:** Aceptada
**Fecha:** 2026-08-06
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Antes del motor de auto-reparación disciplinada, FORTRESS necesitaba una
forma de cerrar el círculo completo: no solo detectar hallazgos sino
arreglarlos y verificar la mejora, sin intervención humana entre
iteraciones. Ese fue el loop autónomo — el primer sistema en actuar en bucle.

## Alternativas consideradas

- **Sin loop autónomo (solo auditoría manual):** descartada — dejaba al
  operador sin una herramienta de mejora continua; detectar sin arreglar es
  medio trabajo.
- **Loop autónomo que empuja a origin:** descartada — viola la doctrina
  propone-dispone de forma absoluta; un sistema que empuja sin firma humana
  ejecuta, no propone.

## Decisión

Un loop autónomo con frenos OBLIGATORIOS: escanear → arreglar → verificar →
re-escanear, en ciclo, con topes de coste y de ciclos que el operador fija
sin default (sin ellos no enciende), red git de checkpoint/revert, y un
debate cuando el score baja donde **el juez es el re-escaneo objetivo, no un
LLM**. El loop opera sobre el árbol vivo con red git; nunca empuja a origin.
Está planificado para retiro por la doctrina propone-dispone.

## Consecuencias

### Positivas
- Cerró el círculo detectar-arreglar-verificar; enseñó las lecciones que
  parieron al motor disciplinado.

### Negativas
- Opera sobre el árbol vivo (aun con red git); la continuidad sin firma
  entre iteraciones es lo que motiva su retiro.

### Neutras
- Sus conceptos (red git, verify, presupuesto) evolucionan en el motor; no
  se heredan literales.

## Referencias

- [FLOWS/LOOP-VIEJO](../FLOWS/LOOP-VIEJO.md) — el flujo completo y su retiro.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — el motor que lo reemplaza.
- Ver ADR-002 (Loop blindado con múltiples redes independientes) para las
  salvaguardas heredadas por el motor de auto-reparación: el bloqueo del
  self-repo pasó de un freno a múltiples redes independientes verificadas
  byte-clean en el AppImage instalado.
