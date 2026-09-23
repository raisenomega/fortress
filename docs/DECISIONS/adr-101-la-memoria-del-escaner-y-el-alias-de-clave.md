# ADR-101 — La memoria del escáner y el alias de clave: el mismo defecto deja de nacer dos veces, sin tocar la identidad

- **Estado**: Aceptada (firmada por el operador el 2026-09-22)
- **Fecha**: 2026-09-22
- **Alcance**: dos palancas, en este orden. (1) El prompt de cada parada del escaneo
  recibe las filas ya registradas de su carpeta con su tipo. (2) Una tabla de alias
  de clave que el sync consulta cuando la clave exacta falla, alimentada por la
  fusión y por el juicio del analista, nunca por la sede. **No toca** `findingIdentity`
  ni la clave `fichero|línea|tipo` de ADR-084, ni la UI, ni el score, ni la
  extinción.
- **Relación**: cierra los cortes 2 y 3 de los hermanos de **ADR-099** con un solo
  mecanismo · se apoya en **ADR-071** (fusión: la más antigua sobrevive, la absorbida
  se marca) y en **ADR-065** (nada muere sin juicio) · completa **ADR-081** (los
  desempates no bastaron contra la deriva) · cierra el riesgo que **ADR-100 §5**
  describió (el duplicado por clave nueva) · migración aditiva según **ADR-077** ·
  la palanca 1 calca a **ADR-088** (el chat ya pasa «hallazgos ya registrados»).
- **Nace de**: la medición del 2026-09-22 sobre `main@c1ff326` y la base viva en
  solo lectura, tras cerrar las tres sub-piezas del arco #3.

---

## 1. Contexto

### 1.1 El sync de punta a punta

La parada devuelve su bloque; el parser fija el tipo (`aTipoDeDefecto`).
`asentarHallazgos` lee la memoria del proyecto, decide con git qué marcas de
mitigado se conservan (`decideConservados`) y llama a `syncFromScan`. `toInsert`
calcula la clave con `findingIdentity` —fichero en minúsculas, línea o `-`,
tipo— y `sync` corre una transacción por reportado: busca por clave exacta con
`SELECT_BY_IDENTITY`; si la encuentra, `TOUCH_FINDING` refresca severidad,
título, fichero, línea, huella, tipo, símbolo y `last_seen`, pone `lifecycle`
en ACTIVE y nunca toca clave ni `first_seen`; si no, `INSERT_FINDING` abre fila
nueva, ACTIVE, con id y `first_seen` de hoy. Nada muere: la ausencia no dice
nada (ADR-065, `ausencia.ts`). En el cierre, `calcularExpediente` suma reportados
y ausentes y de ahí salen el score y los conteos del tablero.

### 1.2 La deriva del tipo es estructural: el escáner no tiene memoria

`buildScanPrompt` y `promptDeParada` llevan nombre, rutas y plantillas. Las filas
ya registradas no viajan: `listMemory` solo se lee al asentar, después. Cada
corrida elige el tipo desde cero entre vecinos, y los desempates de ADR-081
(en el código desde el 2026-09-07) no lo pararon:

| medida en la base viva, 526 vivas | valor |
|---|---|
| mismo fichero y misma línea con más de un tipo | 25 grupos, 53 filas |
| grupos donde todas las filas son posteriores a los desempates | 16 |
| pares en la misma línea con título casi idéntico (deriva pura) | 9 de 32 |

Los vecinos que oscilan: `fuga-de-informacion-en-error` y `secreto-sin-redactar`,
`autorizacion-ausente` y `control-evadible`, `allowlist-permisiva` y
`cors-permisivo`, `tope-no-consultado` y `rate-limit-ausente`. Cada vez que el
modelo elige el vecino nace una clave nueva que ningún alias conoce todavía: un
alias cura la **reaparición** de una clave conocida, no su primera vez. Por eso
la primera palanca no es el alias: es que el escáner sepa qué tipo le puso a
esa fila la última vez.

### 1.3 El hueco: el mismo defecto en claves distintas

90 pares de vivas comparten fichero y símbolo con claves distintas. Fundirlos
por juicio con ADR-071 tal cual **se deshace en el siguiente escaneo**:
`MARCAR_FUSIONADA` retira la clave de la absorbida con el centinela
`fusionada:<ganadora>|<clave>`, el sync casa solo por clave exacta y ningún
código consulta ese centinela, el defecto sigue en la sede absorbida, el escáner
vuelve a emitir su clave, no la encuentra e inserta una fila nueva con la
historia perdida. El centinela hace bien su trabajo —impedir que `TOUCH`
resucite a la absorbida— y no puede hacer el otro.

### 1.4 Lo que la medición descarta: la sede como identidad

Casar por fichero y símbolo antes que por clave **fundiría defectos reales
distintos**. De los 90 pares, 12 comparten tipo y ni esos son el mismo defecto de
forma fiable: ninguno supera 0,5 de similitud de título, y leídos uno a uno,
`send-preorder-notification` 415, 416 y 417 son tres facetas de un relay,
`rate-limit.ts` 20 y 28 son dos defectos, y `fortress-shield` 280 y 288 son
nombre accesible frente a contraste. En la misma línea exacta, 7 de 32 pares con
tipo distinto son dos defectos reales: `allowed-files.ts:45` (path-traversal y
validación asimétrica) o `auroraRouter.ts:38` (cuota, tenant y privacidad). No
hay señal determinista. Distinguir «mismo defecto en clave distinta» de
«defectos distintos en la misma sede» exige juicio, y la sede solo sirve para
proponer candidatos, que es lo que ADR-099 ya hace.

## 2. DECISIÓN 1 — Palanca 1: la memoria del escáner, solo prompt

Cada parada recibe, en su prompt, las **vivas ya registradas de las carpetas que
recorre**, una línea por fila con la forma `fichero:línea tipo` (y el símbolo si
consta), bajo un encabezado que diga lo que son, y esta instrucción: *si vuelves
a encontrar un defecto ya registrado, conserva su tipo y su línea salvo que el
código haya cambiado; no lo reescribas con un tipo vecino; lo nuevo, repórtalo
como siempre*. No pide omitir nada: ADR-065 sigue mandando y la ausencia no mata.

Es el precedente de ADR-088: el chat ya pasa «Hallazgos ya registrados de
escaneos anteriores», una línea por hallazgo (`knownFindings`, tope 40) con
severidad, sitio y título. Aquí la línea lleva el **tipo**, que es lo que
oscila, y va **por carpeta**, que es la unidad de la parada. Coste medido: la
mediana de vivas por carpeta es 1, el percentil 90 es 5 y el máximo 34 (las
migraciones de raisen-nucleo); unos 72 caracteres por línea. Cabe.

**Aceptación**: test rojo → arreglo → mutante → gate 5/5. Tests: el prompt de la
parada lleva las vivas de sus carpetas con su tipo; no lleva las de otras
carpetas ni las extintas; lleva la instrucción de conservar tipo y línea.
Mutantes: quitar el tipo de la línea; incluir otras carpetas. **Medición
después**: un re-escaneo de un proyecto con deriva (Health Flow o mailbd) y el
conteo de grupos «misma línea, más de un tipo» nuevos, que debe ser 0; y el
termómetro de `otro`, que no debe subir.

## 3. DECISIÓN 2 — Palanca 2: el alias de clave, por juicio, consultado por el sync

Para lo que la palanca 1 no cubra: la misma clave conocida que reaparece tras
una fusión, y el mismo defecto que el analista reconoce en otra clave.

1. **Una tabla**, `finding_aliases(project_id, clave, finding_id, origen, at)`,
   clave primaria (proyecto, clave), creada con `CREATE TABLE IF NOT EXISTS` como
   `schema-sightings.ts`: migración aditiva (ADR-077), cubierta por el test de
   migración.
2. **El sync la consulta solo cuando la clave exacta falla**: si hay alias y su
   fila está viva o extinguida, hace `TOUCH` sobre esa fila con la misma
   semántica que hoy para una clave reencontrada, incluida la resurrección de una
   superviviente que un juicio había extinguido y cuyo defecto vuelve; **nunca**
   toca una absorbida. Si el alias apunta a una fila que no existe, se ignora y se
   inserta, y queda dicho.
3. **Quién escribe alias**: la fusión y el juicio. Cada vez que ADR-071 retira una
   clave con el centinela, esa clave pasa a ser alias de la ganadora. Y el
   **juicio del analista**: la cita de hermanos lleva el id de cada uno, y la
   respuesta del analista gana un campo opcional `mismoDefectoQue` con ids
   elegidos **solo entre los citados** (cualquier otro id se ignora, fail-closed);
   cuando llega, FORTRESS funde por ADR-071 —la más antigua sobrevive, severidad
   máxima— y registra el alias. **Esto es el corte 2**: el juicio deja de morir en
   prosa y no necesita una tabla de relaciones, porque su forma persistida es la
   fusión más el alias.
4. **Nunca por sede automática** (§1.4).

**Qué toca de ADR-084: nada de la clave.** La superviviente conserva su
`fichero|línea|tipo`; `findingIdentity` y `reidentificarHallazgos` no cambian;
las 526 vivas no se reescriben y ninguna se reabre. El alias solo redirige una
búsqueda que hoy falla.

**Aceptación**: tests: con alias, el sync toca a la superviviente y no inserta;
sin alias, inserta como hoy; un alias hacia una absorbida nunca la toca; la
fusión registra el alias de la clave retirada; un id fuera de los citados se
ignora. Mutantes que deben morir: saltar la consulta de alias; tocar la
absorbida; aceptar un id ajeno; no registrar el alias al fundir. Gate 5/5.

## 4. El orden importa: primero la raíz, medir, y después el síntoma

La palanca 1 va primero y se mide (§2). Puede reducir tanto la deriva que la
palanca 2 tenga poco que cubrir; por eso el alias no se construye hasta tener
esa medida. Grado bancario: la causa antes que el síntoma.

## 5. El lote sobre los pares existentes, con el patrón seguro

Los 90 pares de misma sede y los 32 de misma línea se juzgan **por lote en la
caja de cada proyecto**, «¿son el mismo defecto?» con razón, y solo los «sí» se
funden y registran su alias. Con el patrón de las sub-piezas anteriores, sin
aflojar nada: app cerrada y comprobada, backup con nombre, ensayo sobre copia,
plan impreso fila a fila, **parada para que el operador lo lea**, ejecución sobre
la viva solo por su mano, y comparación contra el backup. Coste estimado por el
paso B y el re-tipado: unos 10 dólares. Lo que el juicio deje como distinto se
queda como está.

## 6. Lo que NO está en este ADR

- La sede como identidad (§1.4).
- Una tabla de relaciones «mismo defecto» sin fusión: sin consumidor hoy, y se
  pudre cuando una fila muere o cambia de clave; el juicio se persiste como
  fusión más alias, no como relación.
- Reparar juntos varias sedes: exige una correa con varias anclas (ADR-012),
  arco propio.
- La severidad por familia (ADR-100 §4).

## 7. Consecuencias

- **Positivas**: la deriva se ataca donde nace, solo con prompt; una clave
  conocida deja de duplicar; los conteos del tablero dejan de contar dos veces;
  el score deja de inflarse (39 puntos medidos por los 9 pares de deriva clara,
  visibles cuando un proyecto suba del suelo; hoy 7 de 8 están en 0); el juicio
  del analista se persiste sin tabla de relaciones y sin repetirse cada corrida.
- **Negativas**: una tabla más; los alias no caducan (una clave con alias que
  reaparece tras extinguir a la superviviente la resucita, que es la regla de hoy
  para cualquier clave); la respuesta del analista gana un campo opcional; el
  prompt de la parada crece hasta 34 líneas en la peor carpeta.
- **Neutras**: la clave, la UI, el score, la extinción y la fusión de ADR-071 no
  cambian.

## 8. Alternativas consideradas

- **Consultar el centinela desde el sync** — RECHAZADA: una búsqueda `LIKE` sobre
  `identity` sin índice, atada a una codificación pensada para retirar, y que
  solo cubre claves ya fundidas.
- **Casar por sede como identidad** — RECHAZADA con dato (§1.4).
- **Fundir por juicio sin alias** — RECHAZADA: se deshace en el siguiente escaneo
  (§1.3).
- **Una tabla de relaciones** — RECHAZADA (§6).
- **Solo la palanca 2, sin memoria al escáner** — RECHAZADA: cura la reaparición
  y deja nacer la clave nueva cada vez que el modelo oscila.
- **No hacer nada** — RECHAZADA: el escaneo sigue duplicando y el analista sigue
  escribiendo 52 veces un juicio que no se guarda.

## 9. Referencias

ADR-012, ADR-065, ADR-071, ADR-077, ADR-081, ADR-084, ADR-088, ADR-099, ADR-100 ·
`src/application/scan/asentar-hallazgos.ts`, `expediente-del-cierre.ts` ·
`src/infrastructure/persistence/finding-writes.ts`, `finding-sql.ts`,
`finding-touch.ts`, `finding-fusion-sql.ts`, `schema-sightings.ts` ·
`src/domain/scan/scan-prompt.ts`, `src/infrastructure/scan/prompt-de-parada.ts` ·
`src/application/chat/known-findings.ts` · `src/domain/repair/hermanos-del-hallazgo.ts`
· medición del 2026-09-22 (memoria del operador, `fortress-corte-3-adr-101`).

## 10. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-22 por orden del operador, con su línea literal:

> *«YO Jojo dueño del proyecto FORTRESS firmo ADR-101: palanca 1 sí, palanca 2 sí
> (alias por juicio, nunca por sede), corte 2 como fusión+alias sí, el orden sí,
> el lote con parada sí, el alias no caduca, leído §1.4 — Jojo, 22 septiembre
> 2026»*

1. **Palanca 1, la memoria del escáner**: las vivas de la carpeta, una línea
   `fichero:línea tipo`, con la instrucción de conservar tipo y línea:
   [x] sí · [ ] otra: ________
2. **Palanca 2, el alias de clave**: tabla `finding_aliases`, consultada por el
   sync solo al fallar la clave exacta, alimentada por fusión y juicio, **nunca
   por sede**: [x] sí · [ ] otra: ________
3. **El corte 2 se cierra así**: el juicio del analista con ids se persiste como
   fusión más alias, sin tabla de relaciones: [x] sí · [ ] otra: ________
4. **El orden**: palanca 1, medir la deriva, y solo después la palanca 2:
   [x] sí · [ ] otra: ________
5. **El lote sobre los pares existentes**, por juicio y con parada en el plan
   antes de la viva: [x] sí · [ ] otra: ________
6. **He leído §1.4**: la sede no es identidad. [x]
7. **El alias no caduca**: una clave con alias que reaparece tras extinguir a la
   superviviente la resucita, como cualquier clave reencontrada (§3, punto 2; el
   texto no cambia): [x] sí · [ ] muere con su superviviente

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 22 septiembre 2026
