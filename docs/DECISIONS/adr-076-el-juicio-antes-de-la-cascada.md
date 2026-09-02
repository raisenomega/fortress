# ADR-076: El juicio se emite antes de la cascada — borrar un proyecto no mata sus propuestas en silencio

- **Fecha:** 2026-09-02
- **Estado:** Aceptada
- **Área:** Motor · Ciclo de vida del proyecto

## Contexto

`repair_proposals` guardaba un `project_id` suelto, sin clave foránea, así que
borrar un proyecto dejaba vivas sus propuestas. Una sobrevivió catorce días a su
proyecto, invisible para toda la interfaz, y hubo que retirarla a mano por el
canal directo ([ADR-072](adr-072-caducado-no-miente.md), que nombra el caso).

Poner la clave foránea que faltaba (`db902b0`) arregla la mitad del problema y
abre la otra: **la cascada borra en silencio**. Y el silencio, aquí, no es una
molestia estética. Cuando un proyecto se desvanece del disco, la reconciliación
de arranque recorre las propuestas vivas y las caduca **con razón**. Si el
operador lo quita del tablero, la cascada se las llevaría **sin ninguna**.

El mismo hecho —este proyecto ya no está— tendría dos destinos según por dónde
entrara. Eso es exactamente lo que prohíbe
[ADR-059](adr-059-capas-de-estado-no-heredan.md): dos capas que hablan del mismo
estado sin reconciliar entre ellas.

## Decisión

Al retirar un proyecto, sus propuestas **vivas** caducan con juicio **antes** de
soltar la fila. La cascada limpia después lo que ya murió.

El juicio se emite con una razón propia, `PROYECTO_RETIRADO`, y se asienta en el
Libro de la Vida. `removeProject` delega en `retirarPropuesta` —la ceremonia
completa— en vez de reimplementarla: hay un solo camino por el que una propuesta
muere por acto del operador.

## La trampa que define la decisión

`advanceProposal` **no escribe en `omega_log`**. Escribe el parche de la
propuesta y el eslabón en `proposal_events`, y las dos cosas **cuelgan de la
propuesta**: la cascada se las lleva un instante después.

Caducar por la vía obvia habría sido **teatro** — escribir el juicio y borrarlo
acto seguido, con la conciencia tranquila y ni un rastro en la base. El asiento
solo sobrevive si va a `omega_log`, la única tabla sin clave foránea a
`projects` (*el registro es eterno*, ver [DATA-MODEL](../DATA-MODEL.md)), y ese
`append` explícito lo pone `retirarPropuesta`, no el avance.

De ahí la delegación: no es reutilización por economía, es la única forma de que
el juicio exista mañana.

## Alternativas descartadas

### CASCADE puro — más simple, y borra sin decir por qué

Es lo que hacían ya las siete tablas que colgaban del proyecto —chat, hallazgos,
escaneos, actividad, corridas, descartes y la sesión del loop—, y para ellas está
bien: nadie espera un juicio sobre una fila de telemetría. `quality_scans` entra
en el mismo grupo por la misma razón. Una propuesta viva es otra cosa: es trabajo
sin terminar, con un hallazgo congelado detrás.

Se descarta por la divergencia de caminos de arriba, no por doctrina abstracta:
con CASCADE puro, `proyecto ausente` y `proyecto retirado` producirían el mismo
efecto por mecanismos que no se parecen en nada, y solo uno dejaría constancia.

### Reutilizar `PROYECTO_AUSENTE` — colapsa dos causas en una

`PROYECTO_AUSENTE` está definida como *«BD → git: el proyecto ya no está; la
ancestría no se puede consultar»*: la **descubre** la reconciliación al arrancar.
Un `projects:remove` es otra cosa: lo **provoca** un acto deliberado, y se emite
antes de soltar la fila, no después de encontrarse el hueco.

Mismo estado (`CADUCADO`) por causas distintas. `reclaim-reasons.ts` existe
justo para no colapsarlas: *el estado dice qué pasó; la razón dice por qué*.

### Un estado nuevo `RETIRADO` — ya descartado, y sigue descartado

[ADR-072](adr-072-caducado-no-miente.md) lo razonó entero: `CADUCADO` más una
razón explícita dicen lo mismo sin arrastrar `TERMINAL_STATES`, las consultas
que lo expanden, los badges y sus pruebas. Nada de este arco cambia ese cálculo.

## Consecuencias

- Borrar un proyecto deja constancia individual de cada propuesta que mata, y
  esa constancia sobrevive al borrado.
- El record en disco (`FORTRESS-RECORD.md`) se sigue exportando **antes**, así
  que dice *«1 viva en ANALIZADO»* mientras el Libro dirá *«1 CADUCADO»*. Dos
  marcas de tiempo, dos verdades; ninguna sobra.
- `removeProject` pasa a asíncrono. `ipcMain.handle` traga la promesa.
- Las propuestas ya terminales no se re-juzgan: `retirarPropuesta` las rechaza.
- La otra cara del mismo hecho quedó cerrada en `488ad16`: el guard de
  `decideOrphan` comprueba el proyecto ausente **primero**, para que una
  propuesta anterior a GENERATE —que no tiene commit— no se quede esperando a un
  operador que ya no tiene proyecto que mirar.

La elección está fijada por la suite y no solo argumentada aquí: quitar el
`append` al Libro, caducar por `advanceProposal`, o no caducar nada, tumban cada
uno dos pruebas. La base de la prueba es real, no un doble — con un doble, el
teatro habría pasado inadvertido.

## Referencias

- `db902b0` — el mecanismo: las claves foráneas y la migración de recambio.
- `312d6c1` — el juicio: `PROYECTO_RETIRADO` y el caducar antes de borrar.
- `488ad16` — la red: el orden de los guards en `decideOrphan`.
- [ADR-072](adr-072-caducado-no-miente.md) — por qué retirar CADUCA, y el caso
  huérfano que este arco cierra de raíz.
- [ADR-059](adr-059-capas-de-estado-no-heredan.md) — la divergencia de caminos
  que la decisión evita.
- [ADR-065](adr-065-nada-muere-sin-juicio.md) y el principio 22 de
  [PRINCIPLES](../PRINCIPLES.md) — nada muere sin ser visto, que es la ley que
  el silencio de la cascada habría roto.
- [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md) — la máquina de estados completa.
