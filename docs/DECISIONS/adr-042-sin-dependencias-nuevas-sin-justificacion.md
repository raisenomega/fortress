# ADR-042: Sin dependencias nuevas sin justificación

**Estado:** Aceptada
**Fecha:** 2026-08-04
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Cada dependencia npm es superficie de auditoría y un vector de cadena de
suministro: un paquete comprometido corre con los privilegios del proceso.
Un proyecto de seguridad no puede añadir dependencias con ligereza.

## Alternativas consideradas

- **Dependencias libres (añadir lo que convenga):** descartada — cada
  paquete nuevo amplía la superficie de supply chain sin control.
- **Allowlist fija de dependencias permitidas:** descartada — demasiado
  rígida; una lista cerrada frena el desarrollo legítimo y envejece mal.

## Decisión

Cualquier dependencia nueva exige justificación escrita por incremento:
¿se puede resolver con lo que ya hay?, ¿está mantenida?, ¿tiene
vulnerabilidades conocidas? Se prefiere lo que ya está. Los servidores MCP y
las herramientas externas se fijan por versión, nunca "lo último publicado".

## Consecuencias

### Positivas
- La superficie de cadena de suministro crece solo cuando hay razón
  demostrada.

### Negativas
- Añadir una dependencia legítima cuesta más (la justificación es trabajo).

### Neutras
- El árbol de dependencias se mantiene pequeño y auditable.

## Referencias

- [PRINCIPLES](../PRINCIPLES.md) — la disciplina de método.
- [SECURITY-MODEL](../SECURITY-MODEL.md) — la cadena de suministro como
  amenaza.
- ADR-041 (el mismo espíritu de techo mínimo aplicado a comandos).
