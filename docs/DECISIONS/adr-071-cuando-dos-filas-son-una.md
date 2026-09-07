# ADR-071: Cuando dos filas son una — se fusionan por identidad completa, gana la más antigua, y la absorbida se marca

- **Fecha:** 2026-08-24
- **Estado:** Aceptada
- **Área:** Escaneo · Identidad de hallazgos

## Contexto

[ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) cambió la identidad a
`fichero │ tipo │ símbolo` **hacia adelante**. Las filas anteriores conservaron
la fórmula vieja —`severidad │ fichero │ título`— y las dos poblaciones no
pueden empatar jamás.

La consecuencia no era estática: **empeoraba sola**. El escaneo del 2026-08-24
insertó siete filas nuevas y las viejas del mismo defecto siguieron ACTIVE al
lado, porque desde [ADR-065](adr-065-nada-muere-sin-juicio.md) la ausencia ya no
mata. Cada escaneo añade una fila más junto a una que nunca muere.

**Re-escanear no arregla esto**, y está demostrado: la fusión agrupa por
identidad, y las viejas siguen llevando la suya. Re-escanear cien veces no las
tocaría. La reclasificación era inevitable.

Y no puede ser una migración determinista: el **tipo lo ELIGE el modelo** de un
vocabulario cerrado y el **símbolo es un nombre de función**. Ningún `UPDATE`
produce ninguno de los dos. Las filas viejas tenían `tipo='otro'` y `simbolo=''`
porque son los DEFAULT de un `ALTER TABLE`, no porque nadie las clasificara.

Medido antes de decidir el alcance: de las filas de este repositorio con
identidad vieja, solo **17 estaban vivas**. Las demás ya estaban extintas
—reclasificarlas es arqueología: nadie las va a fusionar ni a mirar— y las de
otros proyectos no se reclasifican hasta que se los vuelva a escanear.

## Decisión

Tres piezas separadas a propósito, porque una de ellas no es determinista.

**1 — La fusión, como mecanismo puro.** Dos filas se funden **solo si comparten
identidad completa**: fichero, tipo y símbolo. Nunca por fichero a secas — en
`claude-cli.ts` había cinco filas que eran **tres defectos distintos**, y
fundirlas por fichero habría borrado dos problemas vivos. Colapsar de más es
peor que no colapsar.

**Gana la fila con `first_seen` más antiguo**: su fecha es la historia real del
defecto. Absorber tipo y símbolo sale gratis — dos filas con la misma identidad
ya los comparten, porque la identidad *es* eso.

**La absorbida se MARCA, no se borra:** `EXTINCT`, con
`extinct_reason='fusionada-con-<id>'` y `resolved_at` en **NULL**. No se usa la
transición normal a extinto porque esa escribe la fecha de resolución, y esto no
se resolvió: **dos filas eran una**. Y su identidad se retira con un centinela
`fusionada:<id>|<identidad vieja>`, ni la del ganador ni vacía: la consulta de
selección no filtra por ciclo de vida —una absorbida que conservara la clave
podría salir elegida y volver a ACTIVE—, y vaciarla la devolvería al `PENDING`
de la migración de memoria (`WHERE identity = ''`), que se la recalcularía sola
en el arranque siguiente.

**2 — La clasificación, separada de la escritura.** Una pasada de agente
produce un JSON que el operador revisa; nada toca la base. Así **la parte no
determinista queda fuera de la parte irreversible**: ninguna sección crítica
depende de la red, y la clasificación se puede corregir a mano antes de
escribir.

**3 — La ejecución, determinista y en una sola transacción.** Reclasificar,
fusionar y **verificar antes del commit**: cualquier criterio que falle lanza y
la transacción se deshace entera, así que "esto no cuadra" se resuelve sin
restaurar nada. El backup sigue siendo obligatorio para lo que una transacción
no cubre y como referencia para comparar `first_seen` fila a fila.

## Enmienda (2026-09-06): la superviviente se queda con la gravedad máxima

La regla original decidía **qué fila** queda, y calló sobre **qué severidad**
queda. No era una omisión inocua: como la severidad no entra en la identidad ni
en el desempate, la fila más antigua conservaba la suya y se llevaba por delante
la más alta del grupo.

Ocurrió. De las **cinco fusiones reales del 24 de agosto sobre el propio tablero
de FORTRESS, dos degradaron**: un `HIGH` de la correa de alcance quedó en
`MEDIUM`, y un `MEDIUM` de la config MCP en argv quedó en `LOW`. El tablero
lleva desde entonces puntuando por debajo de lo que sabe.

**Se enmienda así:** gana la misma fila de siempre —su `first_seen` sigue siendo
la historia real del defecto, y el desempate no cambia— **pero se queda con la
severidad MÁXIMA del grupo**. Fundir deja de poder bajar la gravedad: solo puede
subirla o dejarla igual. Es lo único que la fusión escribe sobre la que
sobrevive, y no toca ni su fecha, ni su identidad, ni su ciclo de vida.

Dos efectos que conviene saber antes de usarla:

- **El bloqueo de push es inmediato.** Una fila que suba a `CRITICAL` veta el
  push desde ese instante: la decisión lee las filas vivas, no un número
  guardado.
- **El score del tablero NO se recalcula.** Se persiste al escanear, así que
  sigue mostrando la cifra vieja **hasta el escaneo siguiente**. Que el número no
  se mueva tras la enmienda no significa que no haya hecho nada.

La red que lo sostiene es el **criterio 6** de la verificación en caliente:
ninguna superviviente viva por debajo de la máxima de su grupo. Corre dentro de
la transacción y, si falla, la deshace entera.

Esta enmienda **no repara las dos filas ya degradadas**: eso es un gesto
firmado aparte, no un efecto colateral de arreglar el mecanismo.

## Consecuencias

Ejecutado el 2026-08-24 sobre la base del operador, con la app cerrada y backup
verificado: **17 reclasificadas · 4 fusiones · 5 absorbidas · 23 vivas** en este
repositorio, y ninguna con `tipo='otro'` salvo un caso obsoleto.

| fusión | identidad resultante | `first_seen` de la ganadora |
|---|---|---|
| 3 → 1 | `allowed-files.ts │ path-traversal │ computeallowedfiles` | 2026-08-21 |
| 2 → 1 | `project-path.ts │ path-traversal │ isabsoluteprojectpath` | **2026-08-12** |
| 2 → 1 | `claude-cli.ts │ secret-in-env │ buildenv` | 2026-08-21 |
| 2 → 1 | `claude-cli.ts │ secret-in-argv │ buildargs` | 2026-08-21 |

Una de las fusiones absorbió una fila **nueva**, abierta por el escáner horas
antes: ganó la vieja, del 21 de agosto, y esa fecha es la que se habría perdido.

- **«Revivir los tres hallazgos que murieron mal» era falso.** Eran **cuatro**,
  y **ninguno se revivió**: los cuatro tenían su defecto ya arreglado en el
  código, y revivirlos habría puesto en ACTIVE problemas que no existen. La
  regla vale en los dos sentidos — no se revive por revivir. Lo que sí les falta
  es una razón de muerte registrada, y eso es otra pieza.
- **Marcar en vez de borrar tiene un coste medido y modesto**: de las cinco
  absorbidas, cuatro propuestas de reparación las citaban, ninguna integrada. El
  argumento no es el daño evitado en este caso concreto, sino que **una fila
  borrada no se recupera** y que el registro debe decir lo que pasó.
- La fusión **no deja marca temporal**: `resolved_at` va en NULL por diseño, y
  `findings` no tiene columna de modificación. La fecha de la operación vive en
  el backup y en el commit, no en la fila.
- `extinct_reason` **no lo lee nadie** todavía: el registro es auditable a mano
  y la fila recuperable por él, pero no es una señal que el sistema use. Anotado
  como deuda.
- La clasificación se corrigió a mano en un caso —`project-path.ts`, de
  `doc-contradice-codigo` a `path-traversal`— porque el reclasificador leyó el
  título viejo y el escáner archiva el agujero contra el **código**, dejando
  `doc-contradice-codigo` para el `.md`. El grupo de control confirmó la
  fidelidad del resto: donde había contrapartida del escáner real, el
  reclasificador produjo **identidad idéntica**.
- Las filas con identidad vieja de otros proyectos **no se tocaron**: fuera del
  alcance decidido.

## Adenda (2026-09-06): esto es una migración, y tiene fecha de retirada

La decisión y la enmienda describen **cómo** se funde. Ninguna dice **cuándo
vuelve a hacer falta**, y la respuesta —medida, no supuesta— es que no vuelve.

### Un escaneo no puede crear un duplicado de identidad

`syncFromScan` no inserta a ciegas. Busca primero con `SELECT_BY_IDENTITY`, que
filtra por `project_id` e `identity` **y por nada más** —en particular, **no por
`lifecycle`**—. Si ya hay una fila con esa clave, viva o EXTINCT, la refresca;
solo abre fila nueva cuando no encuentra ninguna:

```ts
const existing = byIdentity.get(projectId, row.identity)
if (!existing) insert.run(row)
else (conservados.has(existing.id) ? touchKeep : touch).run(toTouch(row, existing.id))
```

El refresco por defecto (`TOUCH_FINDING`) además **revive**: pone
`lifecycle = 'ACTIVE'` y `resolved_at = NULL`, así que un defecto que reaparece
vuelve al tablero en vez de quedarse enterrado bajo su propia extinción. La
variante `TOUCH_CONSERVANDO` **no** toca el ciclo de vida, a propósito, para
respetar el MITIGATED que puso el operador. Las dos actualizan en el sitio: por
ninguna de las dos ramas nace una segunda fila con la misma clave.

De ahí se sigue lo que este ADR no decía: **un proyecto que nace bajo
[ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) no acumula duplicados de
identidad.** Los que existen no vienen de escanear muchas veces —eso fue una
suposición nuestra, y era falsa—: vienen del cambio de fórmula, que dejó dos
poblaciones incapaces de empatar.

**Medido el 2026-09-06** contra la base viva, en solo lectura:

| proyecto | vivas | identidad nueva | identidad vieja | grupos fusionables sin reclasificar |
|---|---|---|---|---|
| `fortress-command-center` | 54 | 54 | 0 | **0** |
| `mailbd-main` | 114 | 16 | 98 | **0** |

Cero en los dos, y por la razón de arriba: donde la identidad ya es la de hoy,
no hay duplicados que colapsar.

Una salvedad, para no afirmar de más: la unicidad vale para lo que escribe el
escaneo. El **centinela** de la absorbida —`fusionada:‹ganadora›│‹identidad
vieja›`— se forma con la ganadora y la clave vieja, no con el id de la
absorbida, así que dos filas del mismo grupo comparten centinela. Ocurre hoy,
en dos filas EXTINCT del 24 de agosto. No afecta a ninguna consulta viva —el
criterio 3 solo mira vivas, y ningún escaneo produce esa clave— pero la
identidad de una absorbida no es única y conviene saberlo antes de apoyarse en
ella.

### La fusión es una herramienta de migración, no de mantenimiento

Su único trabajo pendiente son las filas con identidad anterior a ADR-067 —hoy,
**98 en `mailbd-main`**—, y ninguna se puede fundir sin pasar antes por la
reclasificación, que **exige el modelo** (`scripts/fase-b-clasificar.ts`): el
tipo lo elige un agente, no una regla. De ahí tres consecuencias, escritas aquí
para que nadie las tenga que volver a derivar:

- **No es una capacidad de la app y no debe cablearse.** Un disparo automático
  al cerrar un escaneo sería un no-op permanente sobre base limpia —no habría
  nada que fundir—, y el único momento en que sí tendría trabajo es el peor
  posible: una base a medio migrar, marcando absorbidas como EXTINCT, que no
  vuelve. Ninguna capa de la app llama hoy a `createFindingFusion`; el
  empaquetado la deja fuera del binario, y eso es correcto.
- **Se corre a mano, una vez por proyecto**, con la app cerrada y backup
  verificado, como se corrió el 2026-08-24.
- **Cuando la última base con identidad vieja esté migrada, la fusión sale del
  repo**: `fusion-de-duplicados.ts`, `severidad-al-fundir.ts`,
  `finding-fusion.ts`, `finding-fusion-sql.ts`, `red-de-la-fusion.ts` y los
  `scripts/fase-b-*`. Igual que salió el modo `--aplicar` del runner de
  gravedad: lo que ya no tiene trabajo no se queda por si acaso. **Esta adenda
  es el marcador de esa retirada.**

### Dónde vive la red que lo protege

Desde el 2026-09-06 los criterios de la verificación en caliente están dentro de
`src/`, que es lo único que cubre el `include` de vitest:

- **1, 2, 3 y 5** en `src/infrastructure/persistence/red-de-la-fusion.ts`.
- **6** en `src/domain/project/severidad-al-fundir.ts`, desde la enmienda.
- **4** queda fuera, y está documentado en el módulo: compara `first_seen` fila
  a fila contra el **backup**, que es otra base, y una función sobre una sola
  conexión no lo puede mirar. Es la razón por la que el backup sigue siendo
  obligatorio aunque la transacción cubra todo lo demás.

`scripts/fase-b-verificar.ts` queda como cáscara: compone y lanza, sin criterios
propios. Mientras los tuvo, la red del momento más irreversible del sistema era
la única pieza del motor que ningún gate probaba.

## Código

`src/domain/project/fusion-de-duplicados.ts` ·
`src/domain/project/severidad-al-fundir.ts` ·
`src/domain/project/informe-de-fusion.ts` ·
`src/infrastructure/persistence/finding-fusion-sql.ts` ·
`src/infrastructure/persistence/finding-fusion.ts` ·
`src/infrastructure/persistence/red-de-la-fusion.ts` ·
`src/infrastructure/persistence/reparar-gravedad.ts` ·
`src/infrastructure/persistence/fusionada-no-resucita.test.ts` ·
`scripts/fase-b-clasificar.ts` · `scripts/fase-b-ejecutar.ts` ·
`scripts/fase-b-verificar.ts` · `scripts/fase-b-criterio-6.ts` ·
`scripts/reparar-gravedad.ts`
