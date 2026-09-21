# ADR-092 — El sandbox: el código que FORTRESS ejecuta no ve más que su proyecto, y la red se abre con la contención ya puesta

- **Estado**: Aceptada (firmada por el operador el 2026-09-21)
- **Fecha**: 2026-09-21
- **Alcance**: todo proceso que ejecute código de un proyecto auditado — el Bash
  del agente (Terminal, motor, escáner) **y** los comandos que lanza el propio
  FORTRESS (gate, sondas de calidad, git con hooks)
- **Relación**: es la **única dependencia** de ADR-093 Pieza 3 (su ENMIENDA 2) ·
  lo exigen **ADR-098** casilla 1(a), Decisión 4 y §3.7 · cierra la deuda
  estructural número uno de `docs/DEUDAS.md` §6 · ocupa el número que ADR-093
  dejó reservado
- **Nace de**: tres fuentes que coinciden —el backlog de auto-mejora, el registro
  de deudas y la ley firmada— y una cuarta que lo confirma desde fuera, la
  investigación de frontera, verificada fuente por fuente.

---

## §0 — La ley aplicable

ADR-093 ENMIENDA 2 ya dijo qué es esto, y no se reescribe:

> *«Aislamiento estricto end-to-end: cada proyecto en su caja, sin poder ver ni
> tocar otro. Automático e invisible para quien lo usa.»*

Y ADR-098 §4.2 dijo para qué hace falta: ***«La firma autoriza; el sandbox
contiene.»*** Este ADR es la segunda mitad de esa frase. No añade ningún freno:
**es lo que permite quitar los que quedan.**

---

## 1. Contexto

### 1.1 Lo que FORTRESS dice de sí misma

Backlog de auto-mejora, leído el 2026-09-21 (381 observaciones, 711
avistamientos, 7 proyectos). **Lo que más se repite es que los agentes no pueden
ejecutar para verificar**: Bash negado o troceado, un revisor que juzga tests que
no puede correr, ninguna forma de validar SQL ni de instalar dependencias. Cinco
proyectos y 36 avistamientos solo en su área. `docs/DEUDAS.md` §6 lo lleva como
la primera deuda estructural, y cuelga de ella la segunda: verificar stacks que
no son Node.

### 1.2 Lo que el código ya admite

`infrastructure/repair/gate-env.ts:32-36`, escrito antes de este ADR:

> *«LIMITE, que conviene no confundir: esto ACOTA EL ENTORNO, no encierra al
> proceso. El codigo del repo sigue corriendo con el usuario y ve el disco
> entero: puede leer `~/.ssh`, `~/.aws` o lo que haya. […] Contener de verdad
> exige un sandbox, y eso es otra pieza de otro tamano.»*

### 1.3 Lo medido en vivo el 2026-09-21

CLI 2.1.278, `-p` + `acceptEdits`, directorios desechables, comandos inocuos.

| Se midió | Resultado |
|---|---|
| Un hook `PreToolUse` con `matcher` `Write\|Edit\|MultiEdit` frente a una escritura **por Bash** | **la esquiva**: `sed -i` y una redirección pasaron, cero denegaciones |
| El agente escribiendo en `.claude/` | negado: ruta protegida del CLI |
| Un comando que no es de ficheros (`… db push`) | negado: *«This command requires approval»* |
| **El sandbox del CLI, en `-p`** | **funciona**, con `bwrap` 0.9.0 y `socat` instalados |
| — escribir fuera del proyecto | *«Sistema de archivos de solo lectura»*; el fichero no existe |
| — leer la carpeta de «otro cliente» (`denyRead`) | *«No existe el archivo o el directorio»*; `ls` la ve vacía |
| — salir a la red | *«deny network-outbound example.com:443»* |
| — un **proceso hijo** (`sh fuga.sh`) | corrió **sin pedir permiso** y quedó **contenido**: ni escribió fuera ni leyó al vecino |

Esa última fila es el ADR entero en una línea: **Bash libre y contenido a la
vez.** Es lo que ADR-093 Pieza 3 esperaba.

**Un matiz medido, que no es cosmético:** dentro de una carpeta enmascarada con
`denyRead`, la escritura del hijo devolvió `rc=0`. No tocó el disco —escribió en
la máscara temporal— pero **el proceso no se entera de que falló**.

### 1.4 Lo que la frontera externa confirma

De `docs/INVESTIGACION-FRONTERA-2026.md` (rama `docs/investigacion-frontera-2026`),
solo lo que aguantó la verificación:

- **El CLI no va a cerrar el hueco de Bash.** `anthropics/claude-code#45427` —*«A
  hook that gates `Write` and `Edit` cannot detect `cat > file << 'EOF'` … inside a
  Bash tool call»*— y `#29709` están **cerradas como *not planned***. Es lo mismo
  que se midió aquí. Lo contiene un sandbox o no lo contiene nadie.
- **Los incidentes son reales.** Clinejection (GHSA-9ppg-jx86-fqw7, publicado el
  17-feb-2026): un **título de issue** acabó en un paquete malicioso publicado, y
  fue **explotado en la naturaleza**. Mozilla 0DIN (25-jun-2026): un repositorio
  **sin una línea de código malicioso** compromete la máquina. EchoLeak
  (CVE-2025-32711): exfiltración sin un solo clic. En los tres, contenido leído se
  convirtió en acción.
- **La trifecta letal** (Simon Willison, 16-jun-2025): datos privados + contenido
  no confiable + comunicación externa. FORTRESS tiene las dos primeras **por
  definición**. No cierra la tercera solo porque ningún agente sale hoy a la red —
  y **ADR-098 ya firmó ponérsela** (Decisión 4 y §3.7).
- **Precedentes de mecanismo:** AgentScope Runtime (Alibaba) —*«tool call runs
  inside a hardened sandbox»*— y DeerFlow (ByteDance), con ejecución en Docker y
  Kubernetes. *Se cita lo verificado:* «Jupyter» no aparece en el README de
  DeerFlow, y ese README **no afirma** uso en producción.
- **Un sandbox también falla.** CVE-2026-44112 (OpenClaw, CVSS 9.6) es una carrera
  TOCTOU **dentro del propio sandbox**. Por eso §6.

*No se usa aquí* la cifra «>55 % de los incidentes», que **no tiene fuente**; ni
se dice que CVE-2026-44115 sea el hallazgo de `--allowedTools` de esta casa: es
de la misma familia —una allowlist no es una frontera— y es otro defecto.

**Por qué va ANTES.** Abrir la red con (1) y (2) ya presentes cierra la trifecta.
Poner el sandbox primero **corta la pata (1)** —lo privado deja de ser legible— y
entonces la red entra con la contención ya puesta. El orden inverso es el
incidente.

---

## 2. DECISIÓN 1 — Qué aísla: la caja es el proyecto

El código de un proyecto auditado, **lo lance quien lo lance**:

| | Dentro de la caja | Fuera |
|---|---|---|
| **Escribir** | el proyecto y un temporal de sesión | **nada** |
| **Leer** | el proyecto y lo que necesite para correr (intérpretes, librerías del sistema) | **ni la carpeta personal, ni otros proyectos, ni volúmenes montados** |
| **Red** | **los registros de paquetes**, y lo que se abra por lista de dominios | todo lo demás: **cerrado** |

**La frontera cliente-contra-cliente sale sola de aquí**, sin campo de dueño —
que ADR-093 ENMIENDA 2 descartó—: un proyecto no ve a otro porque **ninguno ve
fuera de sí**. No depende de quién sea el dueño, que es lo que la hace sólida.

**Dos trampas del mecanismo, leídas en su documentación oficial**
(`code.claude.com/docs/en/sandboxing`) y que este ADR corrige por construcción:

1. **Activarlo no basta.** *«Default read behavior: read access to the entire
   computer … this default still allows reading credential files such as
   `~/.aws/credentials` and `~/.ssh/`.»* La lectura se cierra **explícitamente**.
2. **Por defecto falla en abierto.** Sin sus dependencias, *«shows a warning and
   runs commands without sandboxing»*; y una orden que falla dentro puede
   reintentarse fuera. FORTRESS lo lanza con `failIfUnavailable: true` y
   `allowUnsandboxedCommands: false`. **Fail-closed**, como `guardBarrera`.

**Decidido al firmar (§12).** *Lectura:* nada fuera del proyecto, salvo lo que
necesita para correr. *Red:* abierta a los **registros de paquetes** y cerrada a
lo demás — un `npm ci` funciona desde el primer día, sin que nadie abra nada por
proyecto. Qué registros son es una **lista cerrada de FORTRESS**, por ecosistema,
que se fija al construir y que **el agente no puede ensanchar**; una dependencia
que venga de una URL de git o de un tarball en otro host **fallará**, y es lo
correcto. *Sin `bwrap` o `socat`:* FORTRESS **no ejecuta código del proyecto**. No
vuelve a la correa de hoy: sin contención no hay ejecución.

---

## 3. DECISIÓN 2 — Dos clases de ejecución, y el sandbox del CLI solo cubre una

Es el hallazgo estructural de este ADR, y sale de leer y de medir:

> *«the operating system enforces that boundary for every Bash, PowerShell, or
> Monitor command and its child processes»* — y, en sus límites: *«Built-in file
> tools: Read, Edit, and Write use the permission system directly rather than
> running through the sandbox.»*

| Clase | Qué es | Dónde vive | Lo cubre el sandbox del CLI |
|---|---|---|---|
| **A** | el Bash **del agente** y sus hijos | `claude-cli.ts` y los cuatro spawns del motor (`graph-analyst`, `graph-generator`, `graph-critico`, `graph-omega`) | **sí** |
| **B** | lo que lanza **el propio FORTRESS** | el gate —`npm ci` y los `npm run`— en `repair/spawn-command.ts`; las sondas en `probe/run-command.ts`; `build-verify.ts:27`; y `git` con los hooks del repo (`repair-git.ts`, `git-merge-applier.ts`) | **no** |

**La clase B es la más peligrosa y es la que queda fuera.** `gate-guards.ts:31-32`
lo dice: *«`npm ci` corre los scripts del repo auditado (preinstall, prepare)»*.
Un `postinstall` de un cliente corre hoy con el usuario y el disco entero, y
**ningún ajuste del CLI lo toca**, porque no pasa por el CLI.

**Decisión:** el mismo encierro para las dos, con el mismo primitivo.
- **Clase A:** el sandbox del CLI, pasado **por spawn** con `--settings` — no toca
  el `.claude/` del cliente, que además está protegido.
- **Clase B:** FORTRESS envuelve **sus propios** spawns. El primitivo es el mismo
  que usa el CLI en Linux —`bubblewrap`—, ya instalado y probado en esta máquina.
  **Decidido al firmar (§12): los envuelve FORTRESS, con `bwrap`.** No pasan al
  Bash del agente: el `npm ci` del gate sigue siendo determinista y no depende
  de lo que un modelo decida teclear.

**Lo que ningún sandbox de este ADR cubre, dicho y no escondido:** `Read`, `Edit`
y `Write` van por el sistema de permisos, no por el sandbox. Y los hooks y los
servidores MCP corren **fuera** —el binario del grafo incluido—: por eso el CLI
protege los ficheros de los que los carga, y por eso este ADR no los toca.

---

## 4. DECISIÓN 3 — Producción bajo firma, CON contención

ADR-098 casilla 1(a), firmada: la firma cubre producción. Este ADR dice **con
qué**:

- **La red de un despliegue es una lista**, por proyecto: los dominios que ese
  despliegue necesita y ninguno más.
- **Las credenciales no se leen: se enmascaran** (`sandbox.credentials` del CLI, y
  su equivalente en la clase B). El agente despliega sin tener la clave delante.
- **Lo que el sandbox NO puede hacer, para que la firma sea informada:** los
  secretos **del propio proyecto** (`.env` dentro de la caja) siguen legibles, y
  el proxy *«does not terminate or inspect TLS traffic»*: decide por nombre de
  host. **Una lista ancha es una vía de salida.** La lista se mantiene estrecha, y
  quien la ensancha es el operador, no el agente.

La firma sigue sin hacer reversible lo irreversible (ADR-098 §4.2). El sandbox
acota **hasta dónde llega** un error; no lo deshace.

---

## 5. DECISIÓN 4 — Qué desbloquea, en este orden

1. **Verificar de verdad.** Los agentes corren los tests que juzgan. Cae la correa
   de `safe-commands.ts:54`: **ADR-093 Pieza 3**, esperada desde el 18-sep.
2. **Los stacks que no son Node.** No hace falta un gate por lenguaje —lo que
   `docs/DEUDAS.md` §6 ya descartó—: el agente corre los comandos **del propio
   proyecto** dentro de la caja, y el gate declara `desconocida` lo que no pudo
   saber (ADR-091).
3. **Producción bajo firma** (ADR-098 1(a)), con §4.
4. **La red para leer documentación** (ADR-098 Decisión 4 y §3.7), con lo privado
   ya ilegible. **La última, no la primera.**

Y una quinta que no se buscaba: el sandbox **habla en estructurado**
(`<sandbox_violations> deny network-outbound …`). Es un **dato**, no prosa: la
regla de `docs/DEUDAS.md` §5.2 dice que de un dato estructurado se deriva una
observación sin romperse en silencio. El sistema nervioso gana un sentido.

---

## 6. Cómo se prueba el sandbox — porque un sandbox también falla

Claw Chain (§1.4): el fallo más grave estaba **dentro** del sandbox. El de
FORTRESS no se da por bueno: **se ataca en el gate.**

Una batería de **fugas que deben fracasar**, contra el `bwrap` real y no contra un
doble —como `checkpoint-fixture` usa git de verdad—: escribir fuera, leer al
vecino, salir a la red, y hacerlo desde un **proceso hijo**. Las cuatro se
midieron a mano el 21-sep; este ADR las vuelve **tests**. Y una quinta, por el
matiz de §1.3: **que una escritura enmascarada no cuente como hecha**.

Un mutante por guarda: quitar `denyRead`, abrir la red, soltar
`failIfUnavailable`. **Si la batería sigue verde, la batería no prueba nada.**

---

## 7. Lo que NO está en este ADR

- **Código.** Define; no construye.
- **macOS y Windows.** Hoy FORTRESS se distribuye como AppImage de Linux. El CLI
  usa Seatbelt en macOS; la clase B pediría su propio primitivo allí.
- **Aislar `Read`/`Edit`/`Write`, los hooks y los MCP** (§3).
- **El Motor sobre proyectos ajenos**: sigue siendo solo FORTRESS sobre sí misma
  (doctrina de los dos mundos).
- **`bypassPermissions`**: sigue fuera (`permission-mode.ts:30`). El sandbox no es
  una excusa para saltarse los permisos; es lo que permite **no necesitarlo**.

---

## 8. Alternativas consideradas

### 8.1 Docker o Kubernetes — RECHAZADA
Es lo que usan los precedentes de §1.4. Piden un demonio que un AppImage no trae
y que **esta máquina no tiene** (medido: ni `docker` ni `podman`). Contradice
*«automático e invisible»*.

### 8.2 Solo el sandbox del CLI — RECHAZADA por insuficiente
Deja fuera la clase B (§3), que es donde corre el `postinstall` del cliente.

### 8.3 Una máquina virtual — DESCARTADA POR AHORA
Aísla más y cuesta otro orden de magnitud. No la pide nada medido hoy.

### 8.4 Un campo de dueño — RECHAZADA, y ya lo estaba
ADR-093 ENMIENDA 2. La caja no pregunta de quién es el proyecto.

### 8.5 No hacer nada y seguir con la correa — RECHAZADA
Es el estado de hoy, y es lo que el backlog más señala: en cinco proyectos.

---

## 9. Consecuencias

**Se gana:** los agentes verifican; Bash deja de ser una lista de tres comandos;
un proyecto no ve a otro; la red puede abrirse sin cerrar la trifecta.

**Se paga, y se firma sabiéndolo:**
- **Dos dependencias nuevas** en la máquina del operador: `bubblewrap` y `socat`.
  Y con el fail-closed firmado **dejan de ser opcionales**: en una máquina que no
  las tenga, FORTRESS **no verifica ni corre el gate** hasta que se instalen. Si
  se empaquetan con la app o se exigen al instalar no está decidido.
- **Más lento:** cada comando arranca dentro de un *namespace*.
- **Cosas que hoy funcionan dejarán de hacerlo** hasta que se les abra hueco: una
  dependencia servida fuera de los registros de paquetes no se instalará; una
  herramienta que escriba en la carpeta personal fallará.
- **Un registro de paquetes es red abierta**, aunque estrecha: lo firmado acepta
  que un `postinstall` contenido pueda hablar con él. No puede leer nada privado
  que contarle (§2), que es lo que lo hace aceptable.
- **El proceso contenido puede no saber que falló** (§1.3).
- Hooks y MCP siguen fuera (§3).

---

## 10. Referencias verificadas

**Código**, contra `main@247611f`: `src/infrastructure/repair/gate-env.ts:32-36` ·
`src/application/repair/gate-guards.ts:31-32` ·
`src/infrastructure/build/build-verify.ts:27` ·
`src/infrastructure/repair/spawn-command.ts` ·
`src/infrastructure/probe/run-command.ts` ·
`src/infrastructure/repair/repair-git.ts` y `git-merge-applier.ts` ·
`src/infrastructure/claude-code/claude-cli.ts` ·
`src/domain/settings/safe-commands.ts:54` ·
`src/domain/settings/permission-mode.ts:30`.

**Medido en vivo** (2026-09-21, turnos reales del CLI 2.1.278, directorios
desechables, comandos inocuos, $0,14): las filas del sandbox de §1.3. Esta
máquina: Linux Mint 22.3, `bwrap` 0.9.0, `socat`, *user namespaces* sin
privilegios habilitados, sin Docker ni Podman.

**Leído directamente por quien redacta:** `code.claude.com/docs/en/sandboxing`,
`…/security`, `…/permission-modes`. **El resto de lo externo**, por agentes
delegados; está en `docs/INVESTIGACION-FRONTERA-2026.md`.

**No medido, y dicho:** el sandbox lanzado **por FORTRESS** y no a mano · la clase
B envuelta en `bwrap` · `sandbox.credentials` · cuánto frena · si
`blockReadsOutsideWorkingDirectories` basta para cerrar la lectura o hacen falta
reglas por ruta · la lectura de `~/.ssh`: en esta máquina no existe, así que la
prueba no decía nada y **no se cita**.

*ADR-098 y la investigación viven en sus ramas (`docs/adr-098-…`,
`docs/investigacion-frontera-2026`), sin mergear a esta fecha.*

---

## 11. Relación con otras decisiones

- **ADR-093** — su Pieza 3 se desbloquea aquí; su ENMIENDA 2 se cumple entera.
- **ADR-098** — la segunda mitad de *«la firma autoriza; el sandbox contiene»*.
- **ADR-091** — de ahí sale que lo no verificable se declare `desconocida`.
- **ADR-079** — la red de reversión deshace lo editado; el sandbox impide lo que
  no se debía tocar. Son complementarias, no intercambiables.
- **ADR-095** — el grafo solo responde del proyecto del turno: el mismo principio,
  en otra capa.
- **`docs/DEUDAS.md` §6** — cierra la primera deuda y abre la segunda.

---

## 12. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-21 por orden del operador, con su línea literal:

> *«firmo ADR-092: 1 nada salvo lo necesario, 2 abierta a registros de paquetes,
> 3 FORTRESS envuelve con bwrap, 4 fail-closed (no ejecuta sin bwrap), 5 leída, 6
> leída — Jojo, dueño y operador, 21 septiembre 2026»*

1. **Lectura fuera del proyecto:** [x] nada, salvo lo que el proyecto necesita
   para correr · [ ] todo menos la carpeta personal y los volúmenes montados ·
   [ ] otra: ________
2. **La red, por defecto:** [ ] cerrada; se abre por lista y por proyecto ·
   [x] abierta a los registros de paquetes, cerrada a lo demás · [ ] otra: ________
3. **La clase B** (lo que lanza FORTRESS): [x] FORTRESS la envuelve con `bwrap` ·
   [ ] esos comandos pasan al Bash del agente, dentro del sandbox del CLI ·
   [ ] otra: ________
4. **Si la máquina no tiene `bwrap` o `socat`:** [x] FORTRESS no ejecuta código del
   proyecto (fail-closed) · [ ] vuelve a la correa de hoy y lo avisa ·
   [ ] otra: ________
5. **He leído §3:** el sandbox del CLI no cubre lo que lanza FORTRESS, ni `Read`,
   `Edit`, `Write`, hooks o MCP. [x]
6. **He leído §5:** la red para leer documentación es lo **último** que se abre. [x]

**Firma del operador:** Jojo, dueño y operador · **Fecha:** 21 septiembre 2026
