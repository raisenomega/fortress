# ADR-019: Botón explícito para correr el gate

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Con el fix generado, ¿el gate corre solo o lo dispara el humano? En pleno
debut del motor, cada juicio cuesta minutos de máquina y el operador está
auditando cada eslabón con lupa.

## Alternativas consideradas

- **Encadenar automáticamente generación → gate:** descartada para el
  debut — el operador pierde el punto de inspección entre eslabones y el
  coste se vuelve invisible.
- **Gate lanzado por temporizador:** descartada (reconstruida
  retroactivamente) — automatismo sin observador en un motor sin
  historial.

## Decisión

El gate se dispara con un botón explícito por propuesta. El
encadenamiento automático queda como evolución posible cuando el motor
acumule confianza; las redes (gate, revisor, firma) no cambiarían.

## Consecuencias

### Positivas
- Cada juicio es un acto observado; el debut se audita eslabón a eslabón.

### Negativas
- Más clics en la operación diaria (aceptado en esta etapa).

### Neutras
- El botón aparece solo en el estado correcto de la máquina.

## Referencias

- ADR-027 (el mismo criterio para el revisor).
