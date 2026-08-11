# ADR-001: Score honesto por expediente ACTIVE

**Estado:** Aceptada
**Fecha:** 2026-08-07
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El score de un proyecto se derivaba del último escaneo. Un hallazgo vivo que
un escaneo posterior no re-veía desaparecía del número: el score podía subir
sin que nadie arreglara nada. Para un sistema cuyo valor es el veredicto
honesto, un score que mejora solo es la peor clase de bug.

## Alternativas consideradas

- **Score por último escaneo (statu quo):** descartada — miente por omisión
  cuando un escaneo parcial no re-observa hallazgos vivos.
- **Score congelado hasta revisión humana:** descartada (reconstruida
  retroactivamente) — convierte el número en un artefacto manual y mata su
  valor de señal continua.

## Decisión

El score se computa desde el expediente ACTIVE completo del proyecto (la
memoria conservadora de hallazgos), no desde el snapshot del último escaneo.
Un hallazgo solo deja de contar cuando se extingue con evidencia o cuando el
operador lo descarta explícitamente.

## Consecuencias

### Positivas
- El score no puede mejorar sin trabajo real: honestidad estructural.
- La extinción con evidencia se vuelve la única salida natural.

### Negativas
- El expediente crece (los hallazgos no se borran); requirió el ciclo de
  vida con extinción documentado en el modelo de datos.

### Neutras
- Al migrar, los scores bajaron a su valor honesto: distinto, no peor.

## Referencias

- [DATA-MODEL](../DATA-MODEL.md) — el paquete de memoria del hallazgo.
- [GLOSSARY](../GLOSSARY.md) — extinción honesta.
- ADR-002 (el otro pilar de higiene del mismo capítulo).
