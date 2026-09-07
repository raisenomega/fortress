# ADR-081: El vocabulario de tipos cubre código ajeno, y elegir de él se guía

- **Fecha:** 2026-09-07
- **Estado:** Aceptada
- **Área:** Escaneo · Identidad de hallazgos · Contrato del escáner

## Contexto

El `tipo` es un tercio de la identidad de un hallazgo (`identity = fichero │
tipo │ símbolo`, [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md)). El
escáner lo **elige** de una lista cerrada, y por eso se suponía estable.

No lo es. Medido el 2026-09-07 sobre `mailbd-main`, con dos escaneos a ocho
minutos de distancia:

| sitio | tipos que le puso el modelo | filas ACTIVE |
|---|---|---|
| `send-invoice/index.ts:268` | `validacion-asimetrica`, `missing-run-guard`, `tope-no-consultado`, `otro` | 10 |
| `order-notification/index.ts:697` | `secreto-sin-redactar`, `otro` | 9 |
| `send-preorder-notification/index.ts:491` | `otro`, `secreto-sin-redactar` | 8 |

Como el tipo entra en la identidad, cada palabra distinta **abre fila nueva**:
de las 21 filas con identidad nueva de `mailbd`, **5 (24 %) son el mismo defecto
contado otra vez**. Solo 1 de los 4 sitios que aparecieron en las dos corridas
cruzó por identidad; los otros 3 entraron como filas nuevas cada vez. El
tablero se multiplica en cada escaneo.

### La causa raíz tiene tres capas

**(a) El vocabulario no cubre código ajeno.** Los 16 tipos salieron de agrupar
los 34 defectos reales *del propio repositorio*
([TAXONOMIA-DE-DEFECTOS](../TAXONOMIA-DE-DEFECTOS.md), «Cómo se derivó»).
`missing-run-guard`, `tope-no-consultado`, `mcp-no-acotado` o
`missing-trust-check` son conceptos de FORTRESS. Contra la
`SECURITY_CHECKLIST` de cinco puntos que el propio escáner recibe:

| punto de la checklist | ¿tipo que lo cubra hoy? |
|---|---|
| 1. Secrets hardcodeados | **ninguno** — los tres tipos de secreto son de otra cosa (herencia de entorno, `argv`, `redactSecrets`) |
| 2. Inyección: SQL, XSS, eval/shell, path traversal | **parcial** — `path-traversal` cubre 1 de los 4 vectores |
| 3. Autenticación y autorización | **ninguno** |
| 4. Deserialización insegura y CORS permisivo | **ninguno** |
| 5. Cabeceras de seguridad y rate limiting | **ninguno** |

Un rate limit ausente no tiene casa, así que el modelo prueba cuatro tipos por
turnos. **El baile de `:268` no es indecisión: es que no hay tipo correcto que
elegir.** Se le pide clasificar un defecto de cliente con un vocabulario hecho
para nuestra casa.

**(b) La regla de elección no existe.** Las definiciones por tipo existen —una
línea cada una en TAXONOMIA y en el docblock de `tipo-de-defecto.ts`— pero **no
viajan al prompt**: `report-contract.ts:30` manda los 16 slugs desnudos. La
única regla es «si de verdad no encaja, pon `otro`» (`:28-29`), sin desempate
entre tipos vecinos, y el único ejemplo del contrato (`:18`) empareja un título
genérico con `secret-in-env`, cuya definición es otra cosa: **enseña a forzar**.

**(c) El tipo está en la identidad, así que el baile fabrica filas.** Y `otro`
como casa de lo ajeno no arregla nada: `otro` entra en la identidad como
cualquier tipo, y en `mailbd` el 52 % de las filas comparten símbolo con todo lo
que hay en su fichero (`handler` ×9, `serve` ×2). Dos defectos distintos e
inclasificables del mismo handler colapsarían en una fila — y **en silencio**,
porque `TOUCH_FINDING` pisa título y línea del primero sin dejar rastro.

### El termómetro ya existía y está en rojo

TAXONOMIA fija el criterio: «si `otro` supera aproximadamente el **15 %** de los
hallazgos de un escaneo, revisar el vocabulario». `mailbd` el 2026-09-07: **33 %
y 29 %** en las dos corridas, 24 % del expediente nuevo. Ningún código lo mide y
ningún asiento lo dice.

### La evidencia: las 119 filas vivas de mailbd por clase real de defecto

Agrupadas por **defecto verdadero** —juzgando por título y línea, no por el tipo
que llevan hoy—, como ADR-067 hizo con sus 45 filas. Las 119 quedan asignadas,
ninguna huérfana:

| clase real de defecto | filas | tipos que le ha puesto el modelo | checklist | ¿casa hoy? |
|---|---|---|---|---|
| rate limit o cuota ausente | 23 | `validacion-asimetrica`, `missing-run-guard`, `tope-no-consultado`, `otro` | 5 | **no** |
| fuga de información en el error | 18 | `secreto-sin-redactar`, `otro` | — | **no** |
| relay abierto (correo saliente con destino o contenido ajeno) | 17 | `validacion-asimetrica`, `missing-trust-check` | — | **no** |
| confianza en datos del cliente (precio, estado, PII del body) | 12 | `missing-trust-check`, `allowlist-permisiva`, `validacion-asimetrica` | 3 | **no** |
| secreto versionado (`.env` en git) | 11 | `secret-in-env` | 1 | **no** |
| autorización ausente (RLS, policy, endpoint anónimo, replay, bucket) | 10 | `otro` | 3 | **no** |
| saneador permisivo | 6 | `allowlist-permisiva` | 2 | parcial |
| control evadible o que falla abierto | 6 | — | 5 | **no** |
| cabecera de seguridad ausente o inefectiva | 5 | — | 5 | **no** |
| salida sin escapar (XSS) | 4 | `validacion-asimetrica` | 2 | **no** |
| CORS permisivo | 4 | `allowlist-permisiva` | 4 | **no** |
| la documentación contradice al código | 2 | `doc-contradice-codigo` | — | **sí** |
| identificador predecible (enumeración) | 1 | — | — | **no** |

**13 clases; una tiene tipo propio y otra lo tiene a medias. 111 de 119 filas
(93 %) no tienen tipo correcto que elegir.**

## Decisión

### 1. Ampliar el vocabulario, derivando del corpus

Once tipos nuevos. Cada uno existe porque **hay al menos un defecto real del
corpus que lo pedía** — el método de ADR-067, con otro corpus. No es una lista
de OWASP traducida:

| tipo nuevo | qué es | filas que lo pedían |
|---|---|---|
| `rate-limit-ausente` | Un recurso se puede consumir sin tope por quien llama: sin rate limiting, o sin cuota de escritura. | 23 |
| `fuga-de-informacion-en-error` | La respuesta de error entrega detalle interno —`error.message` crudo, identificadores, trazas— a quien no debería verlo. | 18 |
| `relay-abierto` | Un recurso que envía o publica hacia fuera (correo, webhook, SMS) acepta destino o contenido de quien llama. | 17 |
| `confianza-en-datos-del-cliente` | Un dato que decide dinero, estado o identidad se toma del cuerpo de la petición en vez de la fuente de verdad. | 12 |
| `secreto-versionado` | Un secreto está en el repositorio: `.env` rastreado, credencial en el código o en un fichero de configuración. | 11 |
| `autorizacion-ausente` | Quien no debería alcanza el dato o la operación: sin RLS, con policy demasiado amplia, endpoint sin sesión o transición de estado sin comprobar. | 10 |
| `control-evadible` | El control existe pero se rodea: falla del lado de permitir, o su clave la dicta quien llama. | 6 |
| `cabecera-de-seguridad-ausente` | Faltan las cabeceras de seguridad, o están escritas donde el despliegue real no las aplica. | 5 |
| `salida-sin-escapar` | Dato no confiable interpolado en HTML, SQL, shell o en un correo sin escapar. | 4 |
| `cors-permisivo` | La política CORS admite orígenes que no debería, incluido `*` o `localhost` en producción. | 4 |
| `identificador-predecible` | Un identificador que protege un recurso se puede adivinar o enumerar. | 1 |

Y una definición se ensancha sin ser tipo nuevo: **`allowlist-permisiva` deja de
decir «de tools»**. La clase es la misma —una lista de permitidos que readmite
lo que decía excluir— y el saneador de HTML de `mailbd` la pedía seis veces.

**`deserializacion-insegura` NO se añade**, aunque la checklist lo pide: el
corpus no tiene ni una. Añadir un tipo que ningún defecto pidió es volver a la
lista genérica que ADR-067 rechazó. Queda como la primera candidata cuando un
corpus lo exija.

Total: **27 tipos**.

### 2. Los tipos de casa se quedan

`missing-run-guard`, `tope-no-consultado`, `mcp-no-acotado`,
`missing-trust-check`, los tres de SSRF: ninguno se retira. Una lista cerrada
puede tener ceros sobre código ajeno; lo que no puede es **faltar casa** para lo
que la checklist manda buscar. Y el escáner se corre sobre el propio repositorio
tanto como sobre el de un cliente.

### 3. Elegir se guía: definiciones, desempate y ejemplo

La cura de la capa (b), y es lo que hace consistente la elección:

- **Las definiciones viajan al prompt.** Cada tipo con su una-línea, no el slug
  desnudo. Es la información que ya existe en TAXONOMIA y que el modelo nunca vio.
- **Desempate explícito entre tipos vecinos.** Los pares que el corpus demostró
  confundibles: `rate-limit-ausente` (no hay tope) vs `tope-no-consultado` (hay
  tope y no se consulta) vs `control-evadible` (hay tope y se rodea);
  `fuga-de-informacion-en-error` (detalle interno al llamante) vs
  `secreto-sin-redactar` (un secreto que no pasó por `redactSecrets`);
  `confianza-en-datos-del-cliente` (el dato manda) vs `salida-sin-escapar` (el
  dato se interpola); `autorizacion-ausente` (nadie comprueba) vs
  `missing-trust-check` (no se exige `project.trusted`); `ssrf-ipv6-mapped` vs
  `ssrf-ipv4-formatos`, que TAXONOMIA ya mantenía separados a propósito.
- **Un ejemplo por tipo, y ninguno de FORTRESS.** El ejemplo actual empareja un
  título genérico con un tipo de nuestra casa; sobre código ajeno eso es
  exactamente lo que no hay que hacer.
- **`otro` se define por lo que NO es.** Sigue siendo destino legítimo, pero el
  prompt dirá que antes de elegirlo hay que descartar los 26.

Es la misma técnica que necesita el eje `efecto` de
[ADR-080](adr-080-severidad-por-ejes-derivados.md) —deuda
`ejes-del-modelo-bailan`—: allí el vocabulario ya cabe y solo falta la guía de
elección. **Aplicación gemela, misma técnica, y el efecto no necesita nada más.**

### 4. El orden importa: (a) y (b) juntos, (c) detrás y una sola vez

- **(a) + (b) van en un solo cambio del contrato** —tipos nuevos, definiciones,
  desempate y ejemplos a la vez—. Cada cambio de vocabulario re-fragmenta lo que
  ya está en la base: si `:268` pasara hoy a `rate-limit-ausente` sería su quinta
  fila. Ampliar en dos tandas dobla el destrozo.
- **(c) la limpieza corre una sola vez, detrás**, sobre el vocabulario ya
  cerrado: el backfill de las 98 filas con identidad vieja de `mailbd`
  (`identidad-inestable-FASE-B-backfill`) y las 5 sobrantes de las nuevas, en una
  pasada. **El backfill no puede correr antes que la regla de elección**: si el
  agente que reclasifica elige con el vocabulario y la guía de hoy, asignará
  tipos inconsistentes y la fusión —que funde solo por identidad completa,
  [ADR-071](adr-071-cuando-dos-filas-son-una.md)— tampoco las colapsará.

### 5. El termómetro pasa a código

Un asiento por escaneo con el porcentaje de `otro`, con el molde de
`asentarSeveridadDerivada` (`nota`/`info`, un asiento por corrida, mejor
esfuerzo). El umbral del 15 % deja de ser prosa en un documento que nadie mira.

Y da el **criterio de cierre del arco, medible**: `mailbd` por debajo del 15 % de
`otro` **y** cero filas sobrantes por corrida, en dos escaneos seguidos. Sin eso,
el arco no está cerrado por mucho que el código esté escrito.

## Consecuencias

- **Cambiar el vocabulario es cambiar el contrato del escáner** (TAXONOMIA: «añadir
  un tipo es cambiar el contrato»), y por eso esto es un ADR con firma y no un
  arreglo. Ninguno de los ficheros que toca —`tipo-de-defecto.ts`,
  `report-contract.ts`, `scan-checklist.ts`, `finding-identity.ts`— está en
  `AUTONOMY_RULES_FILES`: **no cruza innegociable, cruza contrato**. Son cosas
  distintas y conviene no confundirlas.
- **El primer escaneo tras el cambio muestra más filas, no menos** — igual que
  advirtió ADR-067. Cada defecto reclasificado abre fila junto a su versión
  vieja, y eso es lo que la limpieza de (c) viene a recoger. Hasta que (c) corra,
  el expediente empeora antes de mejorar.
- **Las 208 filas históricas no se reescriben** salvo por el backfill explícito
  de (c). Nada de esto toca la base por su cuenta.
- **La identidad no cambia**: sigue siendo `fichero │ tipo │ símbolo`. Se
  descartó quitar el tipo (ver abajo), así que ADR-067 queda intacto.
- **El símbolo sigue siendo el eslabón débil sobre código ajeno**: en `mailbd`
  nombra la edge function entera. No se aborda aquí, pero queda dicho — es lo que
  hace que el tipo no se pueda quitar.
- Se retira `TAXONOMIA-DE-DEFECTOS` como documento de solo lectura: pasa a ser lo
  que el prompt enumera, así que su tabla y `tipo-de-defecto.ts` tienen que decir
  lo mismo palabra por palabra.

## Alternativas descartadas

**Quitar el tipo de la identidad (`fichero │ símbolo`).** Era la cura
estructural: si el símbolo discrimina solo, el baile del tipo deja de fabricar
filas sin tocar el prompt. **El dato la descarta.** En `mailbd`,
`create-checkout/index.ts│serve` tiene dos defectos reales distintos —`is_active`
leído y nunca comprobado (:87) y PII sin validar persistida (:318)— que **solo el
tipo separa**; lo mismo en `send-preorder-notification│handler` (relay de correo
en :436 vs error crudo en :491) y en dos sitios del propio FORTRESS. Con
identidad `fichero │ símbolo`, cuatro defectos reales colapsarían en dos, y en
silencio. TAXONOMIA ya lo decía de otra pareja: «`ssrf-ipv6-mapped` /
`ssrf-ipv4-formatos` — dos vectores distintos que comparten fichero y símbolo.
Solo el tipo los separa». Colapsar de más es peor que no colapsar.

**Aceptar `otro` como casa de lo ajeno.** Más simple y no cuesta contrato. Pero
`otro` entra en la identidad como cualquier tipo, así que dos inclasificables del
mismo handler colapsan igual, en silencio y por la puerta de atrás. Y llamar
clasificación a un tercio de los hallazgos sin clasificar no es honesto: sobre
código de cliente, `otro` al 33 % es el escáner diciendo «no sé qué es esto» una
de cada tres veces.

**Ampliar en dos tandas** (primero lo urgente, luego el resto). Cada cambio de
contrato re-fragmenta la base: dos tandas, dos re-fragmentaciones, y la limpieza
de (c) habría que correrla dos veces o dejarla a medias.

## Código

`src/domain/scan/tipo-de-defecto.ts` · `src/domain/scan/report-contract.ts` ·
`src/domain/scan/scan-checklist.ts` · `docs/TAXONOMIA-DE-DEFECTOS.md`

## Referencias

- [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) — por qué el tipo entró en
  la identidad, y el método de derivar el vocabulario de un corpus real.
- [ADR-071](adr-071-cuando-dos-filas-son-una.md) — la fusión funde solo por
  identidad completa; por eso las filas que bailan en tipo no le entran.
- [ADR-080](adr-080-severidad-por-ejes-derivados.md) — el mismo patrón un nivel
  más arriba: vocabulario cerrado, y la regla en código.
- [TAXONOMIA-DE-DEFECTOS](../TAXONOMIA-DE-DEFECTOS.md) — el vocabulario y el
  umbral del 15 %.
