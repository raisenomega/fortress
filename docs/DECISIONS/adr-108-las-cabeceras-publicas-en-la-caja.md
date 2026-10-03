# ADR-108 — Las cabeceras públicas entran en la caja: el gate del Motor recupera la capacidad de verificar

- **Estado**: Aceptada (firmada por el operador el 2026-09-30)
- **Alcance**: los **TRES directorios padre** de artefactos públicos
  (`~/.electron-gyp`, `~/.cache/node-gyp` y `~/.cache/electron`) se montan en la
  caja **clase B** en **solo lectura** (`--ro-bind`), **nunca por versión**. **No abre red.** **No
  toca**: la clase A, la cura (ADR-107), ADR-106, la trifecta del aislamiento, la
  cota de anchura, ni la tabla de registros del proxy.
- **Nace de**: la medición del 2026-09-30 sobre `main@85c8b05` (DEUDAS §11.1). El
  gate del Motor **no ha pasado `npm ci` ni una vez desde que existe la caja**:
  99 de 99 verdes antes del 21-sep, **0 de 3 después**. Y choca con ADR-107, que
  dejó al Motor **solo** sobre FORTRESS —el único proyecto cuyo gate la caja no
  deja pasar—.
- **Supera**: nada. **Enmienda de hecho el alcance medido de ADR-092**, cuya
  casilla de red se midió con `npm view` y no con un `npm ci` que recompila
  nativos (DEUDAS §11.4).

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo ADR-XXX: monto los dos directorios
> padre de cabeceras públicas (~/.electron-gyp, ~/.cache/node-gyp) en la caja
> clase B en SOLO LECTURA (--ro-bind), nunca por versión (sin entrada del repo,
> evita el vector de la trifecta), con un test que fije que las cabeceras nunca
> entran en escritura. Esto devuelve al gate del Motor la capacidad de verificar
> sobre FORTRESS (que la caja le quitó desde el 21-sep). SÉ Y ACEPTO que el bind
> alcanza también la red de reversión del Terminal y la verificación de Construir
> sobre repos de CLIENTE (comparten enCaja) —es inocuo, medido con bwrap:
> cabeceras públicas, solo lectura, sin red, /media vacío, sin dato de cliente, y
> sin capacidad nueva (el compilador ya estaba en la caja). La clase A (los
> agentes del Terminal y el generador) queda intacta. NO abro red (no es la
> opción ancha). NO toca la cura, ADR-106, la trifecta, ni la cota. Los fixes que
> suban el ABI nativo (subir Electron de major) quedan FUERA del alcance del
> Motor —esos los hago yo con Claude Code en mi terminal, fuera de la caja—.»

### 1bis. La AMPLIACIÓN, firmada el mismo día

El ADR se firmó con dos directorios; al construirlo se midió el `npm ci`
**completo** y hacían falta tres. El operador amplió su firma:

> «AMPLÍO ADR-108 a un TERCER directorio: ~/.cache/electron (el binario oficial
> de Electron, un solo fichero público, el zip del release), también en SOLO
> LECTURA (--ro-bind), directorio padre nunca por versión. Medido: con dos
> directorios npm ci NO pasa (el paquete electron baja su binario de github.com
> que el proxy no abre); con el tercero pasa (rc=0, 28s, sin red, hosts del
> proxy sin cambio). Es la misma clase de artefacto público que las cabeceras,
> mismo riesgo (ninguno nuevo: un fichero, solo lectura, sin red). Y corrijo el
> §3.5: el fix del Electron de anoche NO subía el ABI (pinchaba el rango
> ^39.2.6→39.8.10, lock en 39.8.10 cacheado), así que con el tercer bind SÍ lo
> resuelve el Motor; los saltos de major de verdad (40.0.0, sin caché) siguen
> fuera, para Claude Code en mi terminal.»

## 2. Lo medido, antes de decidir

**La cadena del fallo, trazada el 30-sep.** `npm ci` dispara el `postinstall` del
repo (`electron-builder install-app-deps`), que recompila los nativos contra el
ABI de Electron. `node-gyp configure` busca las cabeceras en su `devdir`; la caja
**tapa el HOME con un tmpfs**, así que no ve `~/.electron-gyp/39.8.10` ni
`~/.cache/node-gyp/24.18.0` —que **sí** están en la máquina, 125 y 2727
ficheros—, y sale a descargarlas. El proxy abre un solo host para Node.js
(`registry.npmjs.org`), no el de cabeceras, y contesta `NEGADO` **sin registrar
nada** (DEUDAS §11.2). Lo que llega al operador es `gyp ERR! Request was
cancelled`, a ocho capas de la causa.

**Reproducido y resuelto con `bwrap` real, sin red (`--unshare-all`):**

| Caja | `node-gyp configure` |
|---|---|
| la de hoy | `gyp ERR! async install ← getNodeDir` — el MISMO stack que el gate real |
| **con los dos `--ro-bind`** | **`gyp info ok`, rc=0, red: NO** |

**Qué contienen los dos árboles:** 122 + 2724 ficheros `.h`, 4 `.gypi`, 2
`installVersion`. **Cero enlaces simbólicos. Nada más.** Artefactos públicos de
Node y Electron, idénticos para cualquiera que instale esas versiones: ni un dato
del operador, ni de un cliente, ni de otro cliente.

**Lo que se ve DENTRO de la caja con el bind puesto**, medido:

```
HOME contiene        : .cache .electron-gyp .nvm      (hoy: solo .nvm)
~/.cache contiene    : node-gyp                        <- nada más del operador
escribir en cabeceras: NO (solo lectura)
/media               : 0 entradas                      <- ningún otro cliente
~/.ssh / ~/.config   : no existen                      <- la base viva, invisible
```

El `tmpfs` del HOME crea el `~/.cache` intermedio **vacío** y solo `node-gyp` se
monta encima: el resto de la caché del operador no se filtra.

**Y no da una capacidad nueva.** El compilador **ya estaba dentro**: medido en la
caja de hoy, `g++`, `make` y `python3` presentes, `compilar: SI`, `red: NO`. Un
repo que quisiera compilar nativo ya podía, trayéndose sus cabeceras en el árbol.
El bind aporta una comodidad, no un poder.

## 3. Lo decidido

### 3.1 Los TRES directorios PADRE, nunca la versión

`Caja.soloLectura` recibe `~/.electron-gyp`, `~/.cache/node-gyp` y
`~/.cache/electron`. **Los padres.**

**Son DOS fallos distintos, y el segundo solo apareció al probar el `npm ci`
completo.** Las cabeceras arreglan `node-gyp configure`; el zip arregla el
`install.js` del paquete `electron`, que baja su **binario** desde `github.com`
—host que la tabla del proxy no abre— sin ver la caché donde ya está. Con solo
las cabeceras, `npm ci` muere en `getaddrinfo ENOTFOUND github.com`.

Montar `<padre>/<versión>` obligaría a sacar la versión de algún sitio, y el
sitio natural sería el `package.json` del proyecto: **un dato que el repo
auditado controla, entrando en la lista de montajes de la caja.** Es la forma
exacta del error que costó la trifecta del aislamiento —*un dato del repo
auditado tratado como fuente de verdad*—. `rutaLimpia` bloquearía la travesía y
la cota bloquearía la anchura, así que no habría agujero; pero el vector se
evita **gratis** montando los padres, que no piden ninguna entrada.

Lo que se revela al montar los padres es **qué versiones tiene cacheadas el
operador**. Números de versión de herramientas públicas. Consta, y no pesa.

### 3.2 SOLO LECTURA, y es la casilla que de verdad importa

`--ro-bind`, por `Caja.soloLectura`, que es lo que ese campo ya hace (línea 69 de
`flags-de-bwrap.ts`). **Nunca `escritura`**, que monta con `--bind`.

**El peor caso, y por qué esta línea lo cierra:** la clase B corre también sobre
repos de CLIENTE (§3.4). Con montaje **escribible**, un proceso de la caja de un
cliente podría escribir en la caché **real** de cabeceras del operador, y esas
cabeceras envenenadas compilarían después el módulo nativo de **FORTRESS**. Es
una cadena de suministro completa, de cliente a producto. Lo niega `--ro-bind`, y
la firma exige un **test que lo fije**: que aparezcan en `--ro-bind` y **no** en
`--bind`.

### 3.3 Solo la clase B. La clase A no se toca

La clase A (`CajaDelCli` → `configDelSandbox` → `--settings` del CLI) es la de
los **agentes**: los turnos del Terminal, el generador del Motor, el grafo. **No
recibe las cabeceras**, y no por economía: el generador **edita, no compila**.
Dejarla intacta es lo más estrecho que se puede firmar.

Son dos mecanismos separados con un campo del mismo nombre, y no se comparten:
el Terminal jamás pasa por `flagsDeBwrap`.

### 3.4 Lo que el operador acepta por escrito: alcanza a dos cajas de cliente

`enCaja` tiene seis caminos. Con el bind:

| Camino | Repo | Recibe |
|---|---|---|
| Gate del Motor (`npm ci`, typecheck, lint, test) | FORTRESS | **SÍ** — el objetivo |
| git del Motor (worktrees, huella, merge) | FORTRESS | sí |
| **Red de reversión del Terminal** (`npm run typecheck`) | **cliente** | **SÍ** |
| **Verificación del árbol de Construir** (`run-build`) | **cliente** | **SÍ** |
| Turnos del agente del Terminal | cliente | no (clase A) |
| Generador del Motor · grafo | FORTRESS · cliente | no (clase A) |

Las dos de cliente comparten `enCaja`, así que reciben el bind. Es **inocuo por
lo medido** en §2, y queda escrito aquí en vez de descubrirse después.

### 3.5 Los fixes de ABI nativo quedan fuera del Motor

Probado: con el devdir en solo lectura y una versión que **no** está en la caché
del HOST, `node-gyp` falla en el `mkdir`, **antes** de intentar la red:

```
gyp ERR! stack Error: ENOENT: no such file or directory,
         mkdir '/home/jojo/.electron-gyp/40.0.0'
```

Así que subir Electron de major **no** entra por aquí. El operador lo firma
explícitamente: **esos los hace él con Claude Code, fuera de la caja.**

> **ENMENDADO el 2026-10-03** — ver §6: el major del ABI entra por el **gesto
> de poblar** la caché del host, sin una línea de código. Esta sección queda
> como registro de lo que se sabía al firmar.

**CORRECCIÓN, firmada en la ampliación:** el fix del Electron que disparó todo
esto **no subía el ABI**. Pinchaba el rango (`^39.2.6` → `39.8.10`), así que el
lock sigue en 39.8.10 y su zip está en caché. **Con el tercer bind, ese fix SÍ lo
resuelve el Motor** —medido: `npm ci` completo sobre su propio worktree, rc=0 en
65 s—. Lo de arriba sigue siendo cierto para un salto de major de verdad. No es una
carencia del Motor; es un fix que necesita red para construirse, y abrirla para
todos los clientes por un hallazgo al año no vale la pena (la **opción ancha**,
que este ADR **rechaza**: añadir `electronjs.org` a la tabla la abriría para todo
agente sobre todo proyecto con `package.json`, incluido el Terminal en repos de
cliente).

### 3.6 Lo que NO cambia, confirmado con código

- **La cura (ADR-107)**: la guarda es `esVehiculoDelMotor(esRepoPropio(path))` en
  `planRepair` y `retryRepair`, capa de aplicación. Un `--ro-bind` no cambia
  quién puede trabajar dónde.
- **ADR-106**: `DEBUT` y el orden viven en `domain/repair/`. Cero relación.
- **La trifecta**: sus tres caras son el saneado del prompt, el corpus declarado
  y `gitComunDe`. Esta última va en **`escritura`**; el cambio va en
  **`soloLectura`**. Listas distintas, flags distintos.
- **La red**: `red(caja.socketDelProxy)` y la tabla de hosts, intactas. El
  `configure` pasa con `--unshare-all`.
- **La cota**: `porQueNoSeMonta` rechaza rutas que **contienen** el HOME.
  `~/.electron-gyp` está **dentro** de él, no lo contiene → pasa **sin tocar la
  regla**. Es el mismo patrón que el `node` de nvm usa desde el 21-sep.

Y el cambio **no lo puede hacer el Motor**: `puedeTrabajarse` devuelve `false`
para los cinco ficheros de la caja, por el glob `src/domain/sandbox/**` y
`src/infrastructure/sandbox/**` de `innegociables-disco.ts`. Lo firma y lo aplica
un humano, o no se aplica.

## 4. Consecuencias

### Positivas
- El gate del Motor vuelve a poder **verificar** sobre FORTRESS. Sin esto,
  ADR-107 y ADR-106 quedan sobre un motor que no puede probar nada de lo que
  propone.
- Sin un byte de red nuevo.

### Negativas
- Dos cajas que corren sobre repos de cliente ven dos árboles de cabeceras
  públicas que antes no veían. Medido: inocuo.
- La caja revela qué versiones de Node y Electron tiene cacheadas el operador.

### Neutras
- Los fixes de ABI nativo siguen fuera del alcance del Motor, por decisión.

## 5. Lo que queda pendiente

**UNA CORRIDA REAL DEL GATE sobre FORTRESS.** El `npm ci` **completo** ya está
probado dentro de la caja, con los args REALES de `enCaja`: **rc=0 en 65 s**, un
solo host en el proxy (`registry.npmjs.org`), «completed installing native
dependencies», y sobre el worktree del fix del Electron de anoche. Lo que falta
es verlo **en producción**: el gate de verdad, con `typecheck`, `lint` y
`test:unit` detrás del `npm ci`, sobre un fix ordinario. El candidato natural es
ese mismo fix del Electron, que con el tercer bind pasa.

Hasta entonces, este ADR está **construido y probado en bwrap aislado, no
confirmado en producción**.

## 6. Enmienda firmada (2026-10-03): la pieza B — el ABI entra por el gesto de poblar

### 6.1 La firma del operador

> «YO Jojo dueño del proyecto FORTRESS enmiendo ADR-108 (§3.5, la pieza B del
> Electron): para subir Electron de major (el ABI), poblar los directorios
> padre de la caché del host (~/.electron-gyp, ~/.cache/node-gyp,
> ~/.cache/electron) con las cabeceras + zip + SHASUMS de la versión destino,
> fuera de la caja, con mi red — como ya tienen los de 39.8.10. Los montajes
> de ADR-108 (los padres, nunca por versión) sirven el major sin una línea de
> código. La versión se sabe por adelantado (npm audit fixAvailable) o
> reactiva (el ENOENT nombra la versión que falta). Descarto el devdir
> escribible: la clase B la usan las sondas de calidad sobre repos de CLIENTE,
> y un devdir escribible dejaría que un cliente envenene mi caché real.
> Descarto la red ancha (github.com en la caja): superficie de exfiltración
> desproporcionada para 1 hallazgo en la historia. Con esto FORTRESS es tan
> capaz como claude -p en cualquier severidad: los CVEs de JS por la correa
> (ADR-111), el ABI por la correa + mi gesto de dos comandos. El gesto de
> poblar queda como procedimiento firmado, no código.»

### 6.2 Lo medido que la hizo posible (2026-10-03, main `64461da`)

Tres datos que §3.5 no tenía al firmarse. (1) **ADR-111 hizo la mitad sin
pedirlo**: `electron` es devDependency y el bump es *lock-only* al generarse
(`--package-lock-only --ignore-scripts` no compila), así que el generador
clase A ya produce el fix HOY; el muro vive solo en el gate. (2) **Los
montajes ya sirven**: ADR-108 monta los PADRES, no `<padre>/<versión>` —
poblados con la versión destino, el mismo `npm ci` que pasó con 39 pasa con
44, sin red. (3) **La frontera con número**: de los 15 HIGH del día, 9 son JS
puro (la pieza A los cierra) y los 6 de ABI son UNA raíz (electron→44.5.1,
las otras cinco son sus transitivas); en toda la historia de la base hay UN
hallazgo ABI.

### 6.3 El procedimiento (el gesto de dos comandos, fuera de la caja)

**Cuándo**: proactivo — `npm audit --package-lock-only` nombra la versión en
`fixAvailable` ANTES de drenar—; o reactivo — el gate falla con
`ENOENT: mkdir ~/.electron-gyp/<VER>`, que la nombra.

**El gesto**, con `VER` la versión destino (p. ej. `44.5.1`):

```bash
# 1) Las cabeceras, al devdir que la caja monta en solo lectura:
npx node-gyp install --target=VER \
  --dist-url=https://electronjs.org/headers --devdir="$HOME/.electron-gyp"

# 2) El zip + SHASUMS, a la cache que electron/install.js consulta:
cd "$(mktemp -d)" && npm init -y >/dev/null && \
  electron_config_cache="$HOME/.cache/electron" npm install electron@VER --no-save
```

Comprobación: `ls ~/.electron-gyp/` lista `VER` y `~/.cache/electron/` tiene
un directorio nuevo con el zip. La receta se escribió de doctrina conocida y
**se verifica en el primer gesto real**: si la herramienta cambió de flags, se
corrige AQUÍ, no en código. El fichero no se consume: queda poblado para
cualquier reintento.

### 6.4 Las dos vías descartadas, con su razón medida

- **Devdir escribible**: la clase B no es solo del Motor — las sondas de
  calidad (`run-command` → `enCaja`) corren sobre repos de CLIENTE con los
  artefactos montados. En solo lectura es inofensivo (contenido público);
  escribible, un proceso del repo de un cliente envenenaría la caché REAL del
  operador, que después compila el módulo nativo de FORTRESS.
- **Red ancha**: el ciclo completo dentro de la caja exige el zip del binario
  — `github.com` + `objects.githubusercontent.com` — una superficie de
  exfiltración desproporcionada para un hallazgo en la historia, y contra el
  espíritu de la tabla cerrada. (Si algún día se abriera un host Motor-only,
  la forma es por punto de uso —como ADR-111 metió la regla npm solo en
  `TOOLS_EDICION`—, nunca por la tabla global que comparten A, B y clientes.)

### 6.5 El balance

Con esta enmienda, **FORTRESS es tan capaz como `claude -p` en cualquier
severidad**: los CVEs de JS por la correa (ADR-111, verificado en vivo), y el
ABI por la correa + el gesto firmado de poblar. Lo que el Motor no hace solo
—bajar artefactos de fuera con red abierta— lo hace el operador en dos
comandos, exactamente donde la doctrina quiere la red: en sus manos.

## Referencias

- **ADR-092** — la caja del proyecto; su casilla de red se midió con `npm view`.
- **ADR-107** — la cura del perímetro: el Motor solo sobre FORTRESS.
- **ADR-111** — la correa de dependencias: la pieza A, y el generador que ya
  produce el bump del ABI que esta enmienda deja verificar.
- `docs/DEUDAS.md` §11 — la medición completa y las tres deudas que salieron.
