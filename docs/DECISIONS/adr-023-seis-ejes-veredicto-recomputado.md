# ADR-023: Seis ejes y veredicto global recomputado por el motor

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Un veredicto binario ("apruebo/veto") sin estructura no deja autopsia: no
se sabe POR QUÉ. Y un veredicto literal del agente deja al sistema a
merced de un desliz del modelo.

## Alternativas consideradas

- **Veredicto binario sin ejes:** descartada — sin desglose no hay
  diagnóstico ni mejora del motor.
- **Confiar el veredicto global al agente:** descartada — al agente no se
  le cree por fe; los ejes son evidencia, la conclusión es del motor.

## Decisión

El revisor devuelve seis ejes (resuelve, alcance, intocable, calidad,
riesgo, veredicto global) con razón textual. El motor RECOMPUTA el
veredicto global desde los ejes con reglas deterministas; el veto solo
procede por cuatro vías duras. Una discrepancia entre lo reportado y lo
recomputado queda asentada como decisión — gana el motor.

## Consecuencias

### Positivas
- Autopsia por eje; veto acotado a criterios explícitos; robustez ante
  deslices del modelo.

### Negativas
- Respuestas fuera de formato se rechazan (respuesta inválida) y cuestan
  el intento.

### Neutras
- El riesgo residual honesto quedó como salida legítima del eje de riesgo.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — principio 10.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — eslabón 5.
