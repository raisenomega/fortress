# ADR-109 — El gate declara lo que absuelve: la herencia llega a quien juzga y a quien firma

- **Estado**: Aceptada (firmada por el operador el 2026-09-30)
- **Alcance**: el `heredado` del gate —comandos que fallaron y **ya fallaban en la
  base**— viaja a **OMEGA**, a la **línea que el operador firma** y al **parte del
  drenaje**. **No toca el mecanismo** de la herencia, que queda exactamente igual.
  **No cambia ningún veredicto.** **No calcula nada nuevo.**
- **Nace de**: la medición del 2026-09-30 al cerrar DEUDAS §11.5. El gate
  absolvía en silencio y lo enterraba en el libro: lo anotó **doce veces** sobre
  FORTRESS desde el 21-ago y nadie leyó el acta.
- **Construido en**: merge `b1645b9`; este ADR es **aditivo** y solo le da hogar
  formal a la firma.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo: construyo que el heredado del gate
> llegue al operador. Cuando el gate absuelve un comando como heredado (rojo en
> la base, no achacable al fix), eso debe viajar a OMEGA, a mi firma y al parte
> —un verde-con-heredado se presenta SABIÉNDOLO ('pasó, pero [comando] estaba
> heredado, no verificado'), nunca como verde-limpio en silencio. Y corrijo los
> dos docblocks mentirosos de gate-result.ts:32. Razón: el mecanismo de herencia
> es buena ingeniería (no exigir que un fix arregle todo el proyecto), pero
> apagar una prueba en silencio es lo que dejó 8 fixes mergeados sin verificar y
> 12 heredados que nadie leyó. Declarar la herencia la convierte de silenciosa en
> firmada —yo decido firmar sabiéndolo, o no—.»

## 2. Por qué esto es un ADR y no solo una deuda cerrada

**Se discutió, y el umbral del operador se impuso al mío.** Mi criterio fue: no
mueve política ni perímetro, el veredicto no cambia, no se calcula nada nuevo
—luego basta DEUDAS §11.6—. El del operador fue el de **ADR-106**: lo que cambia
es **la información sobre la que se decide**.

Y eso es exacto. Antes OMEGA recibía «GATE: verde en todos los comandos» —falso
en los doce— y ahora recibe «verde CON HERENCIA (… NO verificado)». Un juez puede,
con razón, ser más cauto con un fix cuyos tests no se verificaron. **El veredicto
mecánico del gate no se mueve, pero el juicio semántico puede.**

En un sistema donde la firma humana es la última red, **cambiar lo que el
firmante ve es una decisión de arquitectura**, aunque el mecanismo no se toque.
Queda escrito aquí y no en una sección de deudas.

## 3. Lo medido

**El mecanismo NO se discute, y conviene decirlo primero.** Cuando un comando del
gate falla, el gate **vuelve a `baseSha`**, lo corre ahí, y si ya estaba rojo y el
fix no añade ruido en sus propios ficheros, no se lo achaca al fix. Si **todo** lo
que falló era heredado, el gate pasa. La razón está escrita en
`gate-sequence.ts`: «exigirle a un fix que deje verde un árbol que ya estaba rojo
antes de tocarlo es pedirle que arregle el proyecto entero para arreglar una
línea». **Es correcto y sigue igual.**

**El efecto, desde el 10-sep.** `test:unit` estaba rojo en la base de todo
worktree (el kit del escaneo no viaja a un worktree, §11.5), así que se heredaba
**siempre** y el gate pasaba con esa prueba **estructuralmente apagada**.

**EL DATO AMPLIADO, y corrige lo que se reportó corto.** Los doce eran **solo
FORTRESS**. En toda la base son **29**:

| Proyecto | Heredado | Desenlace | |
|---|---|---|---|
| fortress-command-center | `test:unit` | **MERGEADO** | **8** |
| fortress-command-center | `test:unit` | OMEGA | 1 |
| fortress-command-center | `test:unit` | RECHAZADO | 3 |
| **mailbd-main** | `lint` | CADUCADO | **15** |
| mailbd-main | `lint` | RECHAZADO | 2 |

**`mailbd` —un CLIENTE— heredó `lint` diecisiete veces**: la misma absolución
silenciosa sobre código ajeno, de cuando el Motor aún tocaba clientes (antes de
ADR-107). **Lo único que lo salva es que las quince CADUCARON: ninguna de cliente
llegó a integrarse.** El daño quedó en FORTRESS, en los ocho mergeados —siete
firmados por el operador el 14-sep—. El mecanismo, no.

**El gate NUNCA mintió:** lo anotó en el libro cada vez, desde el 21-ago. **Nadie
leyó el acta.** No era un juez ciego que condenaba: era un juez al que le habían
quitado una prueba y lo decía en la evidencia, detrás de dos clics, en JSON crudo.

**Y es el bug OPUESTO al que se supuso al abrir la investigación** —«el gate
rechaza de más»—: no rechazaba de más, **absolvía de más**. De los once rechazos
de FORTRESS, **siete fueron legítimos** (4 lint, 3 typecheck, todos anteriores al
10-sep) y **solo uno** fue por `gate_failed_at=test:unit`. Lo de más se ve
(`RECHAZADO`); lo de menos no (`VERDE` con una prueba apagada).

## 4. Lo decidido

### 4.1 Una sola fuente para las palabras

`domain/repair/aviso-de-herencia.ts`. `avisoDeHerencia(heredado)` devuelve la
frase, o **`null`** cuando no hay nada que avisar. Los tres destinos la usan: una
sola redacción, imposible de desincronizar.

### 4.2 Los tres destinos

| Destino | Antes | Ahora |
|---|---|---|
| **OMEGA** (`elGate` en `lo-que-el-motor-supo`) | `GATE: verde en todos los comandos` — **falso en los doce** | `GATE: verde CON HERENCIA (… NO verificado)` |
| **La firma** (`reason` del evento) | `gate verde`, con la herencia tras **dos clics** en JSON crudo | `gate verde — … heredado de la base, NO verificado` |
| **El parte** (`ChainOutcome`) | no llevaba nada | `aprobada (… heredado…), esperando firma humana` |

**El punto de la firma resultó mejor que un cuello único:** es el `reason` del
evento, que **la UI ya pinta**. El operador lo lee **sin un solo cambio de
interfaz**, y queda escrito en el libro para siempre.

### 4.3 El caso limpio no paga nada

Sin herencia, `avisoDeHerencia` devuelve `null` y **las tres frases son idénticas
a las de antes**. Tiene su propio test y su propio mutante: meter ruido en el
caso normal **cae**. El aviso solo aparece cuando hay algo que avisar.

### 4.4 Los dos docblocks, corregidos SIN borrar la mentira

`gate-result.ts` decía, en la rama `ok: true`, «hoy un verde no puede traer nada
heredado» —**falso, había pasado doce veces**— y en la `ok: false`, «No cambia el
veredicto —rojo es rojo—», que **contradecía** a `gate-sequence.ts`. Los dos
describían un diseño anterior al que corre.

**Las frases viejas se conservan entre comillas**, y el test lo exige así: que no
se **afirmen**, que aparezcan **citadas** con su corrección al lado. Borrar una
mentira vieja deja al siguiente sin saber qué se creyó, ni por qué dejó de
creerse.

## 5. Consecuencias

### Positivas
- **El gate ya no puede absolver en silencio por NINGUNA causa**, no solo por el
  kit. Es la única de las tres reparaciones del gate que impide la reincidencia:
  las otras dos (ADR-108 el `npm ci`, la vía 3 el `test:unit`) cerraron *causas*;
  esta cierra el *mecanismo*.
- La absolución pasa de silenciosa a **firmada**: el operador decide firmar
  sabiéndolo, o no.

### Negativas
- Una línea más en el prompt de OMEGA y en la razón del evento, en los casos con
  herencia. Ninguna en el caso limpio.

### Neutras
- El veredicto del gate es exactamente el mismo que ayer en todos los casos.

## 6. Lo que queda

**DEUDAS §11.8** — la auditoría forense de los **ocho** fixes que llegaron a
MERGEADO con los tests sin verificar. Main está verde hoy (**4640 tests**), así
que no quedó nada roto o se arregló por el camino; la incógnita se cierra barato
y espera la palabra del operador.

## Referencias

- **ADR-108** — las cabeceras en la caja: la primera capa del gate reparada.
- **ADR-106** — el criterio que decidió que esto fuera ADR: cambiar la
  información del que decide es una decisión de arquitectura.
- `docs/DEUDAS.md` §11.5, §11.6, §11.6b, §11.7, §11.8 — la medición completa.
