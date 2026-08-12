# ADR-032: Reglas duras verificadas por la máquina

**Estado:** Aceptada
**Fecha:** 2026-08-01
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

Una arquitectura en capas (ADR-031) se erosiona si su disciplina depende de
la memoria de quien escribe. Los archivos crecen, acumulan
responsabilidades, y la modularidad se pierde poco a poco. Hacía falta que
las reglas de código las vigilara una máquina, no la buena voluntad.

## Alternativas consideradas

- **Linter en modo recomendación (warnings, sin fallar el build):**
  descartada — las reglas suaves se ignoran; un warning que no bloquea nada
  es una regla que no existe.
- **Límites más laxos (100 líneas por archivo, 80 por función):**
  descartada — la atomicidad es un servicio a la legibilidad, no una
  restricción arbitraria; un límite ajustado es la palanca que fuerza a
  dividir antes de que un archivo acumule responsabilidades.

## Decisión

Reglas duras verificadas por ESLint, que fallan el gate: máximo 75 líneas
por archivo y 50 por función; sin `any`; sin emojis en el código; iconos
solo vía el registro de Lucide (el dominio nombra la idea, no el
componente). Si un archivo supera el límite, se divide — nunca se sube el
límite.

## Consecuencias

### Positivas
- La modularidad no depende de la disciplina individual: la vigila el gate.
- El límite fuerza a extraer responsabilidades temprano.

### Negativas
- Más archivos y más extracciones; un cambio grande se reparte en módulos.

### Neutras
- El estilo del proyecto es homogéneo por construcción.

## Referencias

- [ARCHITECTURE](../ARCHITECTURE.md) — las reglas duras y su verificación.
- [PRINCIPLES](../PRINCIPLES.md) — atomicidad al servicio de la legibilidad.
- ADR-031 (la arquitectura que estas reglas protegen).
