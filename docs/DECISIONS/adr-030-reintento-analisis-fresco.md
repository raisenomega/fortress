# ADR-030: El reintento corre análisis fresco, sin cachear el viejo

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

La propuesta nueva del reintento, ¿hereda el análisis de la vieja? Sería
más barato — y exactamente el error equivocado: la razón del rechazo pudo
ser que aquel análisis estaba mal, y el código además avanzó.

## Alternativas consideradas

- **Reusar el análisis viejo:** descartada — perpetúa el posible error de
  origen y juzga código que quizá ya no existe.
- **Re-correr también la elección:** descartada — elegir de nuevo podría
  escoger OTRO hallazgo; no sería un reintento sino trabajo nuevo
  disfrazado.

## Decisión

El hallazgo se HEREDA (sin re-elección) y el análisis corre COMPLETO y
FRESCO sobre el HEAD actual. Si el análisis fresco dictamina que el
hallazgo ya no aplica, la propuesta nueva caduca — final válido: el
reintento sirvió para descubrir que no había nada que arreglar.

## Consecuencias

### Positivas
- Cada intento razona sobre el mundo real de su momento.

### Negativas
- El análisis se paga de nuevo en cada reintento (correcto: es el punto).

### Neutras
- La caducidad por análisis fresco no es fracaso; es extinción honesta
  llegando por otra puerta.

## Referencias

- [FLOWS/RETRY](../FLOWS/RETRY.md) · ADR-028, ADR-029.
- [GLOSSARY](../GLOSSARY.md) — extinción honesta.
