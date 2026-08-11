# ADR-007: Debut sobre hallazgos LOW y MEDIUM

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un motor recién nacido no debe estrenarse sobre los hallazgos más críticos:
un error del generador sobre un CRITICAL duele más que sobre un LOW, y la
confianza se gana con evidencia, no se declara.

## Alternativas consideradas

- **Todas las severidades desde el inicio:** descartada — riesgo máximo con
  historial cero.
- **Solo LOW permanente:** descartada — congela el motor en juguete; sin
  camino de crecimiento la disciplina no madura.

## Decisión

El terreno elegible del motor empieza en LOW y se amplía por evidencia: la
subida a MEDIUM se firmó tras una ejecución auditada de punta a punta (el
motor eligió, verificó — atrapando un hallazgo obsoleto —, generó, pasó
gate y revisor, y un humano firmó). HIGH y CRITICAL siguen fuera hasta
acumular más confianza demostrada. Ampliar el debut no relaja ninguna red.

## Consecuencias

### Positivas
- El riesgo crece solo cuando la evidencia lo respalda.

### Negativas
- Hallazgos graves siguen requiriendo camino manual mientras tanto.

### Neutras
- La política vive en la selección (eslabón de elegir), un solo lugar.

## Referencias

- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — eslabón 1.
- [GLOSSARY](../GLOSSARY.md) — debut.
