# ADR-077: Cuándo una migración deja de ser aditiva — el recambio de tabla y qué le está permitido borrar

- **Fecha:** 2026-09-02
- **Estado:** Aceptada
- **Área:** Arquitectura · Persistencia

## Contexto

[ADR-036](adr-036-sqlite-modular-migraciones-aditivas.md) fijó en agosto que las
migraciones son **aditivas**: *«nunca se borra una columna ni se cambia un tipo;
las columnas nuevas se añaden con `ALTER` verificando su ausencia»*. Una base
antigua siempre abre, y ese es el bien que la regla protege.

La regla dejó de describir el código **el 2026-08-14**, y nadie lo registró.
`expand-agent-runs-kind` (`31a6ba0`) amplió un `CHECK` para que `agent_runs.kind`
admitiera las corridas del motor, y SQLite no deja tocar una restricción en
caliente: hubo que crear la tabla nueva, copiar, borrar y renombrar. Se hizo con
cuidado y se documentó **en su propio fichero**, pero ADR-036 siguió afirmando
lo contrario durante tres semanas.

El arco de la cascada (`db902b0`) trae la segunda, y va más lejos: añade las
claves foráneas que faltaban a `repair_proposals` y `quality_scans` —otro
recambio— y además **borra filas**, algo que ADR-036 ni siquiera contempla. Con
dos casos y una regla que los niega, la aditividad ya no es un invariante; es
un valor por defecto con excepciones, y las excepciones necesitan forma.

## Decisión

La migración de **recambio de tabla** se acepta como patrón, con su
procedimiento fijo, para lo que un `ALTER` no puede expresar: una restricción
nueva sobre una tabla que ya existe.

El invariante de ADR-036 que se conserva es el que importaba: **una base antigua
siempre abre**. Lo que se abandona es el medio —*solo `ALTER`*— que se había
confundido con el fin. El procedimiento, tal como lo dejó la primera:

1. **`foreign_keys = OFF` fuera de la transacción.** El PRAGMA se ignora dentro,
   y sin apagarlo el `DROP` de la tabla vieja arrastra por cascada las filas que
   cuelgan de ella. Se restaura en el `finally`, pase lo que pase.
2. **El recuento se compara dentro.** Si no cuadra, la excepción revierte el
   recambio entero y la tabla vieja se queda donde estaba.
3. **`INSERT … SELECT *` desde la definición única de columnas.** Dos copias del
   mismo esquema divergen; el recambio exige el mismo orden, y una columna de
   más no abre.
4. **La detección mira la DDL guardada** en `sqlite_master`, no un número de
   versión que habría que mantener aparte.

El recambio en sí vive en `recambio-tabla.ts`, extraído al llegar el segundo
caso: es lo único que las dos migraciones comparten, y una tercera no debería
volver a deducir las cuatro reglas de arriba leyendo la anterior.

## La regla de qué se puede borrar

Una migración que añade una restricción encuentra filas que la violan —el rastro
de cuando esa restricción no existía— y tiene que decidir. La regla es:

> **La constricción limpia su propio dominio; el Libro no está en su dominio.**

La migración de la cascada borra exactamente lo que sus claves foráneas nuevas no
admitirían: una propuesta sin proyecto, sus `proposal_events`, y una auditoría de
calidad sin proyecto. No toca `omega_log`, que no recibe clave foránea y cuyos
asientos sobreviven al proyecto por ley.

No es una excepción caritativa: es que `omega_log` **no cae bajo ninguna
restricción nueva**, y una migración no tiene mandato para borrar más allá de lo
que exige aquello que instala.

**El orden importa, y es el contrario al intuitivo.** Con `foreign_keys`
apagado la cascada no actúa, así que los eventos de una propuesta huérfana hay
que borrarlos **a mano y antes que ella**. Al revés se cambiaría una fila
huérfana por cuatro, en la única tabla que estaba limpia.

## Alternativas descartadas

### Dejar la violación dentro de la tabla nueva

Copiar las filas huérfanas y convivir con ellas. Reactivar el PRAGMA **no
revalida lo ya escrito**, así que la violación quedaría muda para siempre y
`foreign_key_check` la delataría en cualquier auditoría futura. Además obligaría
a escribir una prueba **más débil** que la de la migración hermana, que ya exige
`foreign_key_check` vacío tras el recambio. Un corpus no baja su propio listón.

### Limpiar de paso todo el rastro del proyecto muerto

Dejaría la base impecable, y es contrario a la ley del registro eterno: los
asientos de un proyecto borrado son su Libro, y la prueba de que borrar no es
amnesia. Una migración de esquema no decide qué recuerda el sistema.

### Versionar las migraciones con un número

Resolvería la detección sin leer DDL, a cambio de un estado que mantener en
paralelo al esquema real: dos fuentes de verdad sobre lo mismo, el error que
[ADR-059](adr-059-capas-de-estado-no-heredan.md) generaliza. La DDL guardada ya
sabe si la restricción está.

## Consecuencias

- ADR-036 recibe una nota: su invariante sigue vigente, su medio ya no es
  absoluto.
- Una migración no aditiva es **cara y revisable**: recuento comparado y prueba
  que exige `foreign_key_check` vacío.
- La suite de migración pasó a ejercitar el recambio sobre una base vieja de
  verdad: antes creaba las tablas ya con su forma nueva, así que la migración se
  saltaba sola y el gate pasaba sin probar nada.
- El precio: `scripts/migration-test.cjs` quedó en **75 de 75 líneas**. La
  próxima comprobación que se le añada obliga a partirlo.

## Referencias

- `31a6ba0` (2026-08-14) — la primera no aditiva, que estableció el
  procedimiento y sus tres cuidados.
- `db902b0` (2026-09-02) — la segunda: las claves foráneas del arco de la
  cascada, la limpieza de huérfanas y `recambio-tabla.ts`.
- [ADR-036](adr-036-sqlite-modular-migraciones-aditivas.md) — la regla que este
  registro matiza.
- [ADR-076](adr-076-el-juicio-antes-de-la-cascada.md) — la otra decisión del
  mismo arco: por qué la cascada no basta.
- [DATA-MODEL](../DATA-MODEL.md) — el esquema y el orquestador de migraciones.
