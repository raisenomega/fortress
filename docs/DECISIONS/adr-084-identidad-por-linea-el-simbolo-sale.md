# ADR-084: La identidad de un hallazgo lleva la LÍNEA, y el símbolo sale

- **Fecha:** 2026-09-11
- **Estado:** Aceptada
- **Área:** Escaneo · Identidad de hallazgos · Fusión de duplicados

## Contexto

La identidad de un hallazgo es `fichero │ tipo │ símbolo`
([ADR-067](adr-067-identidad-fichero-tipo-simbolo.md), `finding-identity.ts:29-31`).
**No lleva línea.** La línea vive en la otra clave, `fingerprintOf`
(`severidad │ fichero │ línea │ título`), que gobierna los descartes del operador
y es deliberadamente más estricta.

Ese campo de menos es la causa de todo lo que sigue.

El escaneo por paradas de 199 minutos sobre Health Flow dejó **39 filas
duplicadas en 19 sitios — el 22 % de las 175 que quedaron en la base**, y sale
impreso en el informe grado-bancario: la lista de CRITICAL enseña el mismo
checkout de Stripe dos veces. Un entregable que cuenta el mismo defecto dos
veces se lee como inflado.

### Qué campo fabrica las filas, medido sobre 366 hallazgos de 6 proyectos

Inventario del 2026-09-11 sobre el corpus vivo entero, 38 sitios con más de una
fila en el mismo `fichero:línea`:

| campo | sitios donde es el único separador | filas que mantiene separadas | ¿discrimina defectos REALES? |
|---|---|---|---|
| **símbolo** | 17 | **40** | **cero** — las 40 son el mismo defecto |
| **tipo** | 22 | 73 | **uno** (`allowed-files.ts:45`) |

**El símbolo no discrimina ni un solo defecto real en 366 hallazgos.** Es texto
libre, y baila:

| sitio | los dos símbolos | ¿mismo defecto? |
|---|---|---|
| `audit.service.ts:40` | `recordEvent` / `AuditService.recordEvent` | sí — el mismo nombre escrito de dos formas |
| `.env:9` | `""` / `SUPABASE_SERVICE_ROLE_KEY` | sí |
| `auth-guides.md:262` | `""` / `Configuracion de Entorno` / `Variables de Entorno Requeridas` | sí — **tres** filas, un defecto |
| `app.module.ts:12` | `ThrottlerModule` / `AppModule` | sí |

Los 19 sitios de Health Flow se leyeron uno a uno: **19 de 19 son el mismo
defecto con etiqueta distinta. Cero casos de dos defectos reales.**

### Los dos docblocks que defienden el símbolo lo defienden contra el adversario equivocado

El código justifica el símbolo dos veces, y las dos contra **fundir por fichero
a secas**:

- `finding-identity.ts:17-19`: «*sin él, `handleVerify` y `handleAb` —dos
  defectos distintos, mismo fichero, mismo tipo— colapsarían en uno*».
- `fusion-de-duplicados.ts:46-49`: «*Por fichero a secas fundiría defectos
  distintos del mismo archivo — en `claude-cli.ts` hay cinco filas que son tres
  problemas*».

Se fue a mirar. **Los contraejemplos están en líneas distintas**: las tres filas
vivas de `claude-cli.ts` están en `:30`, `:51` y `:73`. Con la línea en la
identidad, el adversario que justificaba el símbolo **desaparece — la línea ya
los separa, y mejor**.

El símbolo estaba justificado por un argumento que solo era válido porque
faltaba la línea.

### El mismo vicio alcanza a la defensa del TIPO en ADR-081

Por honestidad, porque cambia el motivo por el que el tipo se queda:
[ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) descartó quitar
el tipo citando `create-checkout│serve` (`:87` vs `:318`) y
`send-preorder-notification│handler` (`:436` vs `:491`). **También son líneas
distintas.** Ese argumento tampoco sobrevive a meter la línea.

El tipo se queda igualmente, pero por **evidencia nueva**, no por aquella.

## Decisión

**La identidad de un hallazgo pasa a `fichero │ LÍNEA │ tipo`.** El símbolo
sale, la línea entra, el tipo se queda.

### 1. El símbolo SALE

Cero discriminación de defectos reales en 366 hallazgos: solo fabrica filas. Es
texto libre —el único de los tres campos que el modelo redacta en vez de
elegir— y ningún vocabulario cerrado lo alcanza, porque no hay lista de la que
elegir un nombre de función. Los docblocks que lo defendían argumentaban contra
un adversario que la línea vence mejor.

### 2. La línea ENTRA

Separa `handleVerify` / `handleAb` y los tres de `claude-cli.ts` **sin** el
símbolo, que es exactamente el trabajo que se le atribuía al símbolo.

**Contraprueba corrida antes de decidir: CERO identidades actuales abarcan más
de una línea.** Meter la línea no rompe ninguna fusión existente — no hay un
solo caso en la base donde dos filas se estén fundiendo hoy gracias a que la
línea falta.

### 3. El tipo se QUEDA

Es el único separador del **único** defecto real distinto del corpus:

```
src/domain/repair/allowed-files.ts:45    símbolo = "computeAllowedFiles" en LAS DOS
  HIGH  path-traversal          la correa de alcance es léxica: un symlink commiteado escapa
  LOW   validacion-asimetrica   la correa no resta los innegociables al calcularse
```

Dos defectos reales, misma línea, mismo símbolo. **Solo el tipo los separa** — y
nótese que el símbolo tampoco salva este caso, que era su última defensa
posible.

Perder un defecto real es el error caro; 73 filas de ruido del tipo no lo son.
Es el mismo criterio que ADR-081 aplicó al tipo y ADR-071 a la fusión:
**colapsar de más es peor que no colapsar**. El baile del tipo **entre paradas**
—7 de los 19 sitios de Health Flow, un eje que no existía cuando ADR-081 midió—
queda como deuda propia `tipo-baila-entre-paradas`: más pequeña, y con
vocabulario cerrado donde morderla.

### 4. El backfill va en el MISMO arco, y la razón está medida

Cambiar la fórmula **no funde los duplicados que ya existen**: sus filas tienen
grabada la identidad vieja. Y un re-escaneo tampoco los funde — **los duplica**:

- `sync` (`finding-writes.ts:28-34`) busca la identidad **nueva** contra la
  columna que guarda las **viejas**. No empata ninguna → `INSERT`.
- La fila vieja **sigue viva**, porque nada muere sin juicio: la única vía de
  extinción es `extinguirSiObsoleto`, que exige veredicto de agente y marcador
  comprobado contra el fichero ([ADR-065](adr-065-nada-muere-sin-juicio.md)). Un
  escaneo no mata lo que no nombra.

**No es teoría: ya está pasando.** Health Flow tiene hoy vivas 144 filas del
escaneo del 11-sep **y 31 del 10-sep**, porque el segundo no extinguió las del
primero. Por eso 11 de los 19 sitios duplicados tienen filas de dos escaneos
distintos.

La identidad sola llevaría el informe **del 22 % a más del 50 % de duplicados en
el primer re-escaneo** — peor que hoy. Por eso la migración que recomputa las
identidades y funde lo que colapse va en el mismo arco y **corre al arrancar la
app, antes de que ningún escaneo pueda empezar**. La ventana de peligro no se
cierra con disciplina: no existe.

Y no mezcla dos naturalezas. Recomputar `identity` de filas que ya tienen
`file`, `line` y `tipo` es **aritmética pura**, determinista y testeable — la
misma naturaleza que cambiar la fórmula. Lo que sí es de otra naturaleza —
reclasificar con un agente las filas que no tienen tipo — se queda fuera (ver
Consecuencias).

### 5. Este arco CABLEA el motor de ADR-071, no construye uno nuevo

La fusión existe entera y probada desde
[ADR-071](adr-071-cuando-dos-filas-son-una.md): `finding-fusion` (reclasificar +
fusionar), `planDeFusion`, `identidadFusionada` (el centinela que impide que una
absorbida resucite), `severidad-al-fundir` (la superviviente se queda la
**máxima**: fundir no baja la gravedad) y `red-de-la-fusion` (los criterios
1/2/3/5 rescatados a donde el gate sí los cubre).

**No está cableada a producción**: hoy solo la llaman tests y scripts de
backfill manual. Funde por identidad completa, así que sobre la fórmula actual
no tocaría ninguno de los 38 sitios. Es motor terminado esperando conexión, y
este arco es esa conexión.

## Consecuencias

### Lo que colapsa el backfill, medido antes de escribirlo

| proyecto | filas vivas | identidades con la fórmula nueva | colapsa |
|---|---|---|---|
| fortress-command-center | 54 | 54 | **0** |
| APT BY | 9 | 9 | **0** |
| Health Flow V1_FINAL | 175 | 162 | **13** |
| mailbd-main | 128 | 77 | **51** |

**Nuestro propio corpus colapsa cero**: 54 filas post-ADR-081, las más limpias,
y la migración no las toca. Health Flow colapsa **13 y no 20**: los 7 sitios
donde bailó el *tipo* sobreviven separados, que es lo que se decidió. La
aritmética se comporta como el análisis predijo, y eso es parte de la evidencia.
Los 51 de `mailbd` son casi todos `tipo='otro'` —las 6 filas de
`send-invoice:268` diciendo lo mismo— verificados uno a uno.

### Riesgo conocido, a revisar en el commit del código

`add-finding-memory.ts:58` llama `findingIdentity({ ...row, severity, line: null })`
y le pasa `line: null` **a propósito**, porque la fórmula de hoy ignora la línea.
En cuanto la línea entre, ese backfill calcularía `fichero │ - │ tipo` para las
filas que migre: un desajuste sistemático contra todo lo demás. **Revisión
obligatoria del arco** — queda escrito aquí para no descubrirlo a mitad.

### Lo que este arco NO toca

- **Las 98 filas de `mailbd` con identidad pre-ADR-067** (`severidad │ fichero │
  título`) no empatan con ninguna fórmula nueva. Quedan huérfanas salvo
  reclasificación **por agente**, que es juicio y no aritmética: es la deuda
  `identidad-inestable-FASE-B-backfill`, aparte.
- **De qué parada vino una fila.** `findings` tiene `scan_id`, no
  `parada_indice`, así que «el solapamiento carpeta/tema amplifica» es hipótesis
  bien fundada, no medición. Mejora futura para medirlo con precisión; la cura
  no la necesita.
- **El baile del tipo entre paradas.** Deuda propia, más pequeña.

### Positivas

- El informe grado-bancario deja de contar el mismo defecto dos veces: es lo que
  cuesta credibilidad ante quien lo revise.
- El eslabón inestable sale de la cadena. La identidad queda hecha solo de cosas
  que **no redacta el modelo**: una ruta, un número y una palabra de lista
  cerrada.
- ADR-071 pasa de motor guardado a motor en uso.

### Negativas

- **Un defecto que se mueve de línea abre fila nueva.** Es el precio de meter la
  línea, y es el mismo que `fingerprintOf` paga desde siempre por la misma razón:
  falla del lado de conservar, nunca del de borrar en silencio.
- La fórmula cambia por tercera vez (ADR-067, ADR-081 la dejó intacta, ésta). Cada
  cambio re-fragmenta la base una vez; por eso el backfill va pegado.

### Neutras

- `fingerprintOf` **no cambia**: sigue gobernando los descartes con su propia
  clave, más estricta. Las dos claves responden a preguntas distintas.

## Alternativas descartadas

**`fichero │ línea` a secas, sin tipo.** La más limpia: colapsaría los 94
sobrantes del corpus de una vez. **El dato la descarta**: colapsaría también
`allowed-files.ts:45`, que son dos defectos reales —uno de ellos un
`path-traversal` HIGH en la correa de alcance del motor—. Perder un defecto real
en silencio es el error caro, y es el mismo criterio con el que ADR-081 se negó
a quitar el tipo.

**Estabilizar el símbolo en vez de retirarlo.** Es lo que la deuda proponía al
abrirse. No hay nada que estabilizar: el símbolo es texto **libre**, no
vocabulario cerrado, así que ni una lista ni una regla de desempate lo alcanzan
—no hay lista de la que elegir—. Y aunque se lograra, no compraría nada: **no
discrimina ni un defecto real en 366**.

**Resolver el símbolo del grafo de código** (`codebase-memory`, por
fichero+línea) en vez de pedírselo al modelo. Era la otra idea de la deuda, y es
buena: sería una verdad del disco. Pero resuelve un campo que acaba de
demostrarse innecesario, y ata la identidad a que el grafo esté indexado —sobre
código de cliente, no siempre lo está—.

**La identidad sola, sin backfill, dejando el arreglo de lo viejo para después.**
Medido: no funde nada y **duplica en el primer re-escaneo** (>50 % del informe).
Sería el único caso del proyecto en que un arco deja el sistema peor de lo que
estaba.

**Dos arcos con la regla «no rebuildear entre medias».** Funciona —la ventana la
abre el rebuild, no el merge— pero es una red que depende de acordarse. Esta
misma sesión demostró de qué clase es ese fallo: el segundo recambio de
`agent_runs` era de un solo uso y nadie lo sabía hasta que se probó. Se prefiere
la red estructural: la migración corre al arrancar, y no hay nada que recordar.

## Código

`src/domain/project/finding-identity.ts` · `src/domain/project/fusion-de-duplicados.ts` ·
`src/infrastructure/persistence/finding-writes.ts` ·
`src/infrastructure/persistence/finding-fusion.ts` ·
`src/infrastructure/persistence/add-finding-memory.ts`

## Referencias

- [ADR-067](adr-067-identidad-fichero-tipo-simbolo.md) — la fórmula que ésta
  sustituye, y por qué el título salió de la clave.
- [ADR-071](adr-071-cuando-dos-filas-son-una.md) — el motor de fusión que este
  arco cablea, con su red y su regla de gravedad.
- [ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) — cerró el
  baile del tipo entre corridas; su defensa del tipo se apoyaba en el mismo
  hueco que ésta corrige.
- [ADR-065](adr-065-nada-muere-sin-juicio.md) — por qué un re-escaneo no mata lo
  que no nombra, que es lo que obliga a meter el backfill en este arco.
- [ADR-082](adr-082-escaneo-por-paradas-con-cobertura-declarada.md) — el
  recorrido por paradas, que amplificó la deuda al multiplicar los solapamientos.
