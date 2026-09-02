# ADR-036: Persistencia SQLite local con esquema modular y migraciones aditivas

**Estado:** Aceptada
**Fecha:** 2026-08-03
**Autor:** operador (registro retroactivo, 2026-08-11)

> **Nota (2026-09-02).** El invariante que este registro protege —*una base
> antigua siempre abre*— sigue vigente. Lo que dejó de ser absoluto es el
> medio: desde `31a6ba0` (2026-08-14) existen migraciones de **recambio de
> tabla**, no aditivas, para lo que un `ALTER` no puede expresar (añadir una
> restricción a una tabla que ya existe). Su procedimiento, y qué les está
> permitido borrar, en
> [ADR-077](adr-077-cuando-una-migracion-deja-de-ser-aditiva.md).

## Contexto

FORTRESS guarda todo su estado en el equipo del usuario (proyectos,
hallazgos, historial, telemetría). Hacía falta decidir el motor de
persistencia, cómo organizar el esquema y cómo evolucionarlo sin romper las
bases que ya existen en equipos de versiones anteriores.

## Alternativas consideradas

- **Un esquema monolítico en un solo archivo:** descartada — no escala; un
  archivo con todas las tablas viola la disciplina de modularidad y se
  vuelve ilegible.
- **Un ORM:** descartada — sobre-abstracción para un uso que son consultas
  directas parametrizadas; añade dependencia y capas sin ganancia.

## Decisión

SQLite local vía `better-sqlite3` (binding síncrono), sin ORM, con consultas
siempre parametrizadas. El esquema se MODULARIZA por dominio funcional (un
archivo de esquema por dominio, más un orquestador de migraciones). Las
migraciones son ADITIVAS: nunca se borra una columna ni se cambia un tipo;
las columnas nuevas se añaden con `ALTER` verificando su ausencia, con un
default que mantiene válido el esquema viejo. Una base antigua siempre abre.

## Consecuencias

### Positivas
- El esquema se lee por dominio; una base de cualquier versión anterior
  sigue funcionando.

### Negativas
- El esquema acumula columnas históricas (no se limpian) — el precio de la
  compatibilidad hacia atrás.

### Neutras
- La base nunca sale del equipo (cero telemetría, ADR-056).

## Referencias

- [DATA-MODEL](../DATA-MODEL.md) — las 19 tablas y el esquema modular.
- [ARCHITECTURE](../ARCHITECTURE.md) — la capa de persistencia.
- ADR-031 (la modularidad que este esquema refleja).
