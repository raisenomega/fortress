# ADR-035: Tema OMEGA como identidad visual única

**Estado:** Aceptada
**Fecha:** 2026-08-03
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

FORTRESS es un producto con carácter, no una herramienta genérica. Al montar
la consola había que decidir su identidad visual: ¿un tema neutro
intercambiable, o una identidad propia y consistente que el operador
reconozca de un vistazo?

## Alternativas consideradas

- **Tema oscuro estándar (el de fábrica del framework):** descartada — sin
  identidad; FORTRESS parecería cualquier otra app de escritorio.
- **Tema configurable por el operador:** descartada — la identidad no es una
  preferencia; un producto con carácter no ofrece "elige tu skin". La
  consistencia visual es parte de lo que es.

## Decisión

Una identidad visual ÚNICA, el tema OMEGA: primary dorado
`hsl(38 85% 55%)` sobre fondo negro-navy, tipografías Syne (display) y DM
Sans (texto) servidas localmente, iconos solo de Lucide vía el registro
semántico (ADR-032). Sin colores hardcodeados: siempre tokens. Sin toggle
de tema — la identidad no se configura.

## Consecuencias

### Positivas
- FORTRESS es reconocible; la identidad es coherente en toda la interfaz.

### Negativas
- No hay tema claro ni personalización visual (decisión consciente).

### Neutras
- Los tokens de color centralizan cualquier ajuste futuro de la paleta.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — la identidad como regla del proyecto.
- [PAGES](../PAGES/README.md) — las vistas que la visten.
- ADR-032 (iconos solo Lucide, verificado por máquina).
