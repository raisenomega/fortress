# ADR-016: Instalación estricta sin reuso de node_modules

**Estado:** Aceptada
**Fecha:** 2026-08-08
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El worktree necesita dependencias para correr el gate. La tentación obvia
es enlazar el node_modules del proyecto vivo: segundos en vez de minutos.

## Alternativas consideradas

- **Symlink al node_modules vivo:** descartada — dependencias fantasma (el
  fix podría depender de algo instalado a mano en el vivo) y contaminación
  bidireccional de artefactos de build.
- **Instalación mutable (npm install):** descartada — puede resolver
  versiones distintas al lockfile; el juicio no sería reproducible.

## Decisión

Instalación limpia y estricta desde el lockfile, dentro del worktree, en
cada juicio. Hermético: lo que el gate ve es lo que el lockfile declara.

## Consecuencias

### Positivas
- Cero dependencias fantasma; juicio reproducible.

### Negativas
- Alrededor de un minuto de instalación por juicio (medido en el debut:
  63 segundos, 451 paquetes).

### Neutras
- El timeout de instalación es propio y mayor que el de los comandos.

## Referencias

- ADR-004, ADR-017.
