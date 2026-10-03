# ADR-111 — La correa de dependencias (pieza A): el Motor regenera el lock, nunca los nativos

- **Estado**: Aceptada (firmada por el operador el 2026-10-03)
- **Alcance**: tres piezas que juntas hacen a FORTRESS capaz de cerrar los CVEs
  de JS puro (vitest, transitivas) como lo haría `claude -p`: (1) el **grupo de
  alcance** en el `.fortress/config` de FORTRESS —`when: package.json → allow:
  package-lock.json`—; (2) la **pre-aprobación de npm** en los args del
  generador, SOLO en la forma `npm install <paquete>@<versión> …
  --package-lock-only --ignore-scripts`; (3) el **prompt instruye esa forma
  exacta** cuando el hallazgo ancla en `package.json` y el grupo está declarado.
- **No toca**: la caja ni la trifecta del aislamiento —la red del generador ya
  va solo a `registry.npmjs.org`, sin montaje ni flag nuevo—; el perímetro (el
  Motor sigue siendo solo de FORTRESS, ADR-107); la firma del operador como
  única vía de integración —`package.json` y `package-lock.json` están en la
  blacklist de autoMerge: un lock regenerado SIEMPRE pasa por OMEGA y por la
  firma, nunca auto-merge—; ni el Electron (el ABI, la pieza B / §3.5 del plan
  de dependencias: decisión aparte del operador sobre las cabeceras).
- **Nace de**: los ~$1,50 quemados el 2026-10-01/02 en negativas honestas —el
  Motor entendía el CVE de JS y no podía tocar el lock— y de la corrida de
  prueba del 2026-10-02 que midió el hueco antes de firmar.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo ADR-XXX (la correa de dependencias
> — pieza A, los CVEs de JS): declaro el grupo de alcance (when: package.json →
> allow: package-lock.json) en el .fortress/config de FORTRESS; pre-apruebo npm
> en los args del generador SOLO con --package-lock-only --ignore-scripts
> (regenera el lock sin recompilar nativos ni correr scripts de paquetes —
> medido: el npm install normal muere al recompilar better-sqlite3, y
> --ignore-scripts es más seguro); y obligo a esos flags por regla, no por
> confianza en el instinto del generador. Esto hace a FORTRESS capaz de los
> CVEs de JS (vitest, transitivas) como claude -p, con un diff de lock (~173
> líneas) que OMEGA juzga y yo firmo (nunca auto-merge). Solo sobre FORTRESS
> (el Motor, la cura ADR-107), no toca clientes. El Electron (HIGH, el ABI)
> sigue fuera — es la pieza B / §3.5, mi decisión aparte sobre las cabeceras.
> No toca la trifecta ni el sandbox: la red del generador ya va solo a
> registry.npmjs.org, sin montaje ni flag nuevo.»

La firma dice «ADR-XXX» porque el número se asigna al archivar: corresponde
ADR-111.

## 2. Lo medido ANTES de firmar (2026-10-02, main `79e59d4`, CLI 2.1.288)

La corrida de prueba —el generador con sus args REALES sobre un worktree de
`repair-worktrees/`, caja clase A puesta— midió cuatro cosas, y la primera
tumbó la premisa con la que esta pieza se había planeado:

1. **«El generador ya tiene Bash» era falso para npm.** Con `acceptEdits` y
   `autoAllowBashIfSandboxed: false`, todo `npm` pide una aprobación que en
   headless nadie da: 5 negativas, $0,17, cero comandos npm ejecutados. Solo
   corrieron los comandos de lectura que el CLI auto-aprueba (grep, git
   status). Por eso esta pieza NO es «cero código, solo declarar el grupo»:
   sin la pre-aprobación, el grupo abre un terreno al que el generador no
   puede llegar.
2. **Con npm pre-aprobado, el camino del lock funciona entero.** `npm install
   vitest@^4.1.11 --save-dev --package-lock-only --ignore-scripts` salió con
   código 0 dentro de la caja: el registro respondió, el lock quedó resuelto a
   4.1.11, y `vitest` y `@vitest/mocker` salieron del audit (verificado desde
   fuera de la caja).
3. **El diff que OMEGA juzgará y el operador firmará: 173 líneas** para un
   bump (lock +118/−51, `package.json` +2/−2), con ruido legítimo de
   re-resolución (entradas anidadas de `@tailwindcss/oxide-wasm32-wasi`).
4. **El `npm install` normal muere en la caja**, y muere justo donde la pieza
   B empieza: el `node-gyp rebuild` de `better-sqlite3` sale a buscar las
   cabeceras a `nodejs.org:443` y el sandbox lo niega. La clase A no monta los
   artefactos de ADR-108 (eso es del gate, clase B). `--ignore-scripts` no es
   solo seguridad: es lo que hace POSIBLE el camino.

## 3. La forma de la regla, medida (2026-10-03, CLI 2.1.288)

La regla es `Bash(npm install * --package-lock-only --ignore-scripts)` — un
comodín EN MEDIO, no un prefijo. Trece corridas contra la capa de permisos
real (C1–C13), con marcadores en disco donde la palabra del modelo no bastaba:

| Comando pedido | Veredicto de la capa |
| --- | --- |
| `npm install pkg@v --save-dev --package-lock-only --ignore-scripts` | APRUEBA (el comodín absorbe paquete y flags intermedios) |
| `npm install pkg@v --package-lock-only` (falta un flag) | NIEGA |
| `npm install pkg@v … --ignore-scripts --save-dev` (algo DESPUÉS) | NIEGA: la regla ancla al final |
| `npm install --package-lock-only --ignore-scripts` (sin paquete) | NIEGA: el comodín no casa vacío |
| `npm run build` / `npm install pkg` a secas | NIEGA |
| `npm install …seguro… && npm run build` | NIEGA el comando ENTERO: la segmentación juzga cada tramo |
| `npm install …seguro… && touch X` / `; touch X` | corre — pero `touch` y `echo` corren TAMBIÉN SIN esta regla (auto-aprobación del CLI que el generador ya tenía, medida el 2026-10-02); no es capacidad que esta regla abra, y la contienen la caja (fs/red) y la correa (post-generación) |
| la regla dentro de la lista con comas de `--allowedTools` | funciona igual (aprueba la forma segura, niega sin flags) |

Dos consecuencias de diseño: la pre-aprobación NO usa `:*` (un
`Bash(npm install:*)` aprobaría el install normal, que recompila nativos: es
el mutante de la pieza 2); y como el comodín no casa vacío, el prompt debe
nombrar SIEMPRE `<paquete>@<versión>` — que es además la forma dirigida que un
fix de CVE necesita.

## 4. Las tres piezas

1. **El grupo** (declarativo, `.fortress/config` de FORTRESS): `when:
   package.json → allow: package-lock.json`. Dirigido, no simétrico: un
   hallazgo anclado en el lock NO abre `package.json`, y un hallazgo anclado
   en cualquier otro sitio no abre nada de esto. `parseScopeGroups` ya filtra
   el grupo universal (`allow: ['**']` tira la lista entera a la correa
   universal — ese es el mutante de la pieza 1).
2. **La pre-aprobación** (`motor-tools.ts` → `TOOLS_EDICION`, solo el
   generador): la regla de §3. Los agentes de lectura (analista, crítico,
   OMEGA) NO la llevan: su lista sigue sin entrada Bash alguna.
3. **El prompt obliga la forma** (`generator-prompt.ts`): cuando el ancla es
   `package.json` Y los globs del grupo abren `package-lock.json`, el prompt
   dice la forma exacta y avisa de que cualquier otro npm se niega. Sin esa
   instrucción el instinto del generador es `npm install` normal —medido—, que
   la regla niega y el nativo mata: vueltas quemadas en un camino sin salida.
   Si el grupo no está declarado, la instrucción NO aparece: mandar a regenerar
   el lock sin terreno sería fabricar una violación de correa.

## 5. El riesgo que se acepta, y qué lo contiene

- **Un lock regenerado es un diff grande que nadie lee línea a línea.** Medido:
  173 líneas para un bump. Lo contienen, en orden: `--package-lock-only` (no
  escribe `node_modules`), `--ignore-scripts` (ningún script de paquete corre),
  la red de la caja (solo `registry.npmjs.org`), la correa post-generación
  (`checkScope` sobre lo que git vio), OMEGA (juzga el diff), y la firma — el
  lock está en la blacklist de autoMerge, así que el auto-merge no existe para
  él por construcción.
- **La regla aprueba `npm install <cualquier-paquete>` con los flags.** Un
  generador desviado podría añadir un paquete en vez de subir uno. Ese cambio
  es exactamente lo que OMEGA ve en el diff del lock y lo que la firma decide;
  con `--ignore-scripts` y lock-only, el paquete ni se descarga ni ejecuta nada.
- **Editar `.fortress/config` cambia su huella** (ADR-102 §4): las pausas por
  terreno atadas a la huella vieja se re-evalúan. Es el comportamiento
  diseñado — la pausa existe para que un cambio de config la levante.

## 6. Qué queda fuera, a propósito

- **Electron y todo lo que recompila el ABI** — pieza B / §3.5: necesita las
  cabeceras en la caja del generador (hoy son del gate, ADR-108) y es decisión
  aparte del operador. El camino sigue MUERTO por dos capas: la regla niega el
  install normal, y la red niega `nodejs.org`.
- **`npm audit fix --package-lock-only`** como gesto de lote: sin medir;
  anotado para cuando un escaneo lo pida.
- **Otros ecosistemas** (pypi, crates…): la regla y la instrucción son de npm.
  Cada ecosistema, con su herramienta y su medición, el día que se use.
