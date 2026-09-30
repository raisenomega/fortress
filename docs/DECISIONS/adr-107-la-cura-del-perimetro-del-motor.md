# ADR-107 — La cura del perímetro del Motor: el Motor es de FORTRESS, el Terminal es del cliente

- **Estado**: Aceptada (firmada por el operador el 2026-09-30)
- **Alcance**: el Motor de reparación queda **solo sobre FORTRESS**, con la guarda
  en el NACIMIENTO de la propuesta (`planRepair` y `retryRepair`). Se **elimina el
  LOOP de raíz** conservando los dos frenos duros de gasto y la tabla
  `loop_sessions`. Se añade el cartel en `MotorView`. **No toca**: el Terminal, la
  correa, el tribunal, el gate, OMEGA, ni la firma.
- **Supera a**: **ADR-063** en su primera mitad («el motor opera sobre cualquier
  proyecto registrado»), y solo en el VEHÍCULO.
- **Nace de**: la medición del 2026-09-30 sobre `main@0cf4d16`, al construir
  ADR-106: subir el debut a HIGH habría abierto HIGH sobre proyectos de CLIENTE,
  contra la doctrina de los dos mundos que el operador tenía escrita desde el
  14-sep (`internal/DOCTRINA-PRODUCTO.md`) y donde ya constaba la desviación con
  su nombre: `motor-expuesto-en-proyectos-ajenos`.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo ADR-XXX (la cura del perímetro del
> Motor): el Motor de reparación queda SOLO sobre FORTRESS —guarda en el
> nacimiento (planRepair y retryRepair), reusando esRepoPropio—; los clientes van
> por el Terminal. Elimino el LOOP de raíz (su puerta en la UI, el reanudador, el
> motor, los canales IPC), conservando su presupuesto renombrado 'topes del
> motor' —que el Drenaje usa— y la tabla loop_sessions —la historia—. Apago
> loop_enabled de mailbd en la base. Añado el cartel en MotorView: 'este proyecto
> se repara por el Terminal'. Esto supera a ADR-063 —correcto en agosto cuando no
> había Terminal grado bancario para el cliente; ahora lo hay—: se supera el
> vehículo, no la capacidad —el cliente no pierde reparación, cambia de puerta—.
> Acepto que FORTRESS pierde la autonomía continua desatendida; si la quiero,
> será un arco nuevo (el bucle sobre el Terminal). Con esto, el Motor solo drena
> FORTRESS a grado bancario, y ADR-106 (subir DEBUT a HIGH) cae exacto solo sobre
> FORTRESS.»

## 2. Lo medido

| Hecho | Dato |
|---|---|
| Proyectos donde el Motor ha corrido ALGUNA vez | **2**: FORTRESS (118 propuestas) y mailbd (59) |
| Los otros seis proyectos registrados | **0 propuestas** |
| Ciclos de LOOP en toda su historia | **6**, todos en mailbd, último el 21-ago |
| Ciclos de LOOP sobre FORTRESS | **0** (su sesión paró por `error`) |
| `loop_enabled` hoy | solo mailbd |
| Disparadores del Motor sin filtro de repo propio | **los tres**: Drenaje, botón y LOOP |

De las 59 propuestas de mailbd, el LOOP explica ~6 (sus seis ciclos, el 21-ago);
las otras 53 salieron del botón o del Drenaje.

## 3. Lo decidido

### 3.1 La guarda va en el NACIMIENTO, no en los bordes

Una propuesta nace en dos sitios —`plan-repair.ts` y `retry-repair.ts`— y por
`planRepair` pasan los tres disparadores. Guardar ahí cierra el Motor de una vez
y **no depende de que alguien se acuerde** de guardar el cuarto disparador que
aparezca: la misma lección que el corpus (un cuello, no ocho) y los innegociables
(derivar, no enumerar).

Se niega con **desenlace propio**, no con `ocupado`: el proyecto no está ocupado,
es que **no es su vehículo**. Pintar de rojo lo que es una regla haría buscar una
falla inexistente — la misma razón por la que el drenaje ya distingue `ocupado` de
`averia`.

### 3.2 El LOOP se elimina de raíz

Aportaba lo que el Terminal no da —`scan()` y luego `fix()` en bucle, desatendido—
pero **su vehículo era el Motor**, que esta cura cierra. Con 6 ciclos en toda su
vida y cinco semanas parado, mantener una tercera puerta que además contradice la
doctrina no se sostiene.

**Se conserva lo que el Drenaje usa:** los DOS frenos duros de gasto
(`costCapUsd`, `maxCycles`), que el operador fija a mano y **sin default** —
«nadie decide por él cuánto está dispuesto a gastar»—, bajo la sección renombrada
**«Topes del motor»**. **Se van las cuatro válvulas** (denegaciones seguidas,
re-escanear cada, vueltas en vacío, descartes seguidos): describen el
comportamiento de un bucle que se repite solo, y el Drenaje no se repite solo.
El corte no se inventa aquí — está declarado en `loop-budget.ts`.

**Se conserva `loop_sessions`**: es historia medida y no se borra.

### 3.3 El cartel

Una defensa que niega sin decir por qué es una defensa que confunde. Con un
proyecto de cliente activo, `MotorView` dice que se repara por el Terminal.

## 4. Por qué esto supera a ADR-063, y con respeto

ADR-063 (16-ago) levantó el encierro del Motor porque el estreno ya había
producido el espécimen auditado que ADR-003 pedía, **y porque entonces no había
otro camino para el cliente**. Hoy lo hay: el Terminal de grado bancario, que
resuelve cualquier severidad sobre código ajeno. Aquella decisión fue correcta
para su momento; lo que cambió es el mundo alrededor.

**Se supera el VEHÍCULO, no la capacidad.** El cliente no pierde reparación:
cambia de puerta.

## 5. Lo que se pierde, aceptado por escrito

FORTRESS deja de tener **autonomía continua desatendida**. Tras esta cura nada
corre solo: FORTRESS se drena porque el operador pulsa Drenaje, y los clientes se
reparan porque el operador se lo pide al Terminal. Si algún día se quiere esa
autonomía, es **un arco nuevo**: el bucle sobre el Terminal, que es el vehículo
correcto.

## 6. Consecuencias

### Positivas
- Un mundo, una herramienta: el Motor de FORTRESS, el Terminal del cliente.
- ADR-106 cae exacto: el único camino del Motor es el Drenaje sobre FORTRESS.

### Negativas
- Se pierde el drenaje desatendido, aceptado arriba.

### Neutras
- El nombre de las claves de settings (`loopCostCap`, `loopMaxCycles`) envejece:
  se renombra lo que se VE, no las claves, para no migrar los valores que el
  operador ya tiene guardados.

## Referencias

- **ADR-063** — el que esta decisión supera en su vehículo.
- **ADR-003**, **ADR-007**, **ADR-106** — el debut y su escalera.
- `internal/DOCTRINA-PRODUCTO.md` — la doctrina de los dos mundos.
