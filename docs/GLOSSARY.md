# FORTRESS — Glosario

Términos del proyecto, en orden alfabético. Definiciones cortas; el detalle
vive en `docs/ARCHITECTURE.md`, `docs/OVERVIEW.md` y los flujos futuros.
Ningún término es aspiracional: todos existen en el código o en la
documentación escrita.

Índice: [A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) ·
[G](#g) · [H](#h) · [I](#i) · [L](#l) · [M](#m) · [O](#o) · [P](#p) ·
[R](#r) · [S](#s) · [T](#t) · [V](#v) · [W](#w)

## A

### Agente
Proceso de Claude Code lanzado con un rol y prompt específicos que actúa
dentro de un proyecto. Cada corrida de agente del motor queda asentada en el
[libro de vida](#libro-de-vida) con coste en tokens y duración.

### Allowlist
Lista mínima de comandos que un agente puede ejecutar sin pedir permiso:
`npm run typecheck`, `npm run lint`, `npm run test:unit`. Es un techo, no una
sugerencia; nada fuera de la lista se auto-ejecuta.

### analysis
Estructura que devuelve [C2](#c2-analyzetarget): objetivo, veredicto
(REAL/OBSOLETO), qué cambiar, dónde, patrón a copiar, qué no tocar, riesgo y
tokens usados. Es el contrato de entrada de [C3](#c3-generate-fix).

### ausencia (no es veredicto)

Principio del escaneo: que una corrida no nombre un hallazgo no afirma que el
problema no esté. El escáner es un modelo leyendo código y ni siquiera repite la
misma redacción entre corridas.

### ANALIZADO
Estado de una propuesta cuyo análisis C2 dictaminó REAL: el hallazgo existe y
es accionable. Lista para generar fix.

### AppImage
Formato del binario de distribución en Linux. Se ejecuta desde un mount FUSE
(filesystem comprimido): no se puede grepear directo ni reemplazar en
caliente con la app corriendo.

### APROBADO
Estado al que pasa una propuesta cuando el humano firma el fix aprobado por
OMEGA (eslabón de firma humana del motor).

### ARCHITECTURE.md
Documento de arquitectura. Dos ubicaciones válidas: en la raíz de los
proyectos auditados (el scaffolder de FORTRESS lo genera ahí) y en `docs/`
para FORTRESS mismo. El probe de operación acepta ambas.

### asar
Contenedor del código empaquetado dentro del binario. La verificación
post-rebuild se hace sobre el asar extraído, por identificadores (los
nombres de archivo se disuelven en el bundle).

## B

### ausentes

Los hallazgos vivos que un escaneo no volvió a nombrar. **Siguen vivos**: en el
tablero y puntuando. La ausencia no extingue — ver
[ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md).

### base_sha
SHA del HEAD del repo anclado en el momento en que nace una propuesta del
motor. Es la base exacta del [worktree](#worktree): reproducibilidad
estricta.

## C

### C1 (selectTarget)
Primer eslabón del motor: SELECCIÓN determinista del hallazgo a reparar.
Elige el elegible de menor [superficie](#superficie-surface); mismo input,
mismo elegido. No genera fix ni toca código.

### C2 (analyzeTarget)
Segundo eslabón: ENTENDER. Agente de solo lectura, grafo-primero, que
verifica el hallazgo contra el código real y dictamina REAL u OBSOLETO
(un hallazgo que un agente juzga obsoleto se extingue, no se repara).

### C3 (generate-fix)
Tercer eslabón: GENERAR. Produce el fix en un [worktree](#worktree) aislado,
bajo [correa](#correa-allowedfiles) de alcance y
[presupuesto](#presupuesto-por-propuesta). Jamás toca el árbol vivo.

### CADUCADO
Estado terminal: la propuesta dejó de tener sentido (por ejemplo, C2
dictaminó OBSOLETO o fue reemplazada). Los terminales no se re-abren.

### claude-analyst
Actor de agente del eslabón C2 en el [libro de vida](#libro-de-vida).

### claude-generator
Actor de agente del eslabón C3. Agente propio, distinto del analista: quien
entiende no es quien escribe.

### claude-omega
Actor del revisor semántico independiente del motor (no confundir con
[Sentinel OMEGA](#sentinel-omega), el agente 11 de auditoría). Aparece como
`omega` en el libro de vida (`proposal_events.actor`): es la etiqueta corta
de telemetría, no otro actor — el nombre conceptual completo es claude-omega.
Es el único actor del motor cuya etiqueta se acorta; analyst, generator y
gate se registran con su nombre completo.

### CLAUDE.md
Doctrina de agente. Dos ubicaciones con roles distintos: en la raíz del repo
de FORTRESS es la doctrina operativa del proyecto (la lee Claude Code al
arrancar); en `templates/` es la plantilla universal que FORTRESS distribuye
a otros proyectos.

### Cognition (agente)
Especialista que consolida aprendizajes de las sesiones en el
[COGNITION-LOG](#cognition-logmd) como patrones con causa raíz y prevención.

### COGNITION-LOG.md
El cerebro por proyecto: patrones ([PTN](#ptn)), reflexiones por sesión y
mapa de atención. Vive en la raíz del proyecto con path fijo; el runtime lo
lee al arrancar y lo reescribe tras cada escaneo.

### contextIsolation
Aislamiento de Electron: el renderer corre en un contexto separado, sin
acceso a Node (`nodeIntegration: false`). Toda comunicación pasa por el
[preload](#preload) tipado.

### correa (allowedFiles)
Conjunto de archivos que C3 tiene permitido tocar, anclado al archivo del
hallazgo más sus tests hermanos. Un diff que se sale de la correa se rechaza
por violación de alcance.

## D

### DDD (Domain-Driven Design)
Arquitectura en capas concéntricas con dependencias hacia adentro:
presentación y adaptadores dependen del dominio, nunca al revés. Ver
`docs/ARCHITECTURE.md`.

### debut
El terreno que el motor tiene permitido reparar: hallazgos LOW y MEDIUM.
HIGH y CRITICAL quedan fuera hasta acumular confianza demostrada.

### decideReindex
Decisión pura (dominio) de cuándo realinear el Knowledge Graph ante un
cambio de HEAD del repo: on-boot, on-focus o manual, con cola serial.

## E

### ELEGIDO
Estado inicial de una propuesta: C1 la eligió y quedó anclada a su
[base_sha](#base_sha).

### Extincion honesta
Un [finding](#finding) solo se declara extinto con evidencia: ausente del
escaneo vigente Y con su archivo modificado. Nunca por fe ni por antigüedad.

## F

### Featuring
El catálogo de capacidades de la plataforma: cada capacidad va atada a su
leyenda (la idea que la sostiene) y a su freno (la regla que la hace segura).

### finding
Hallazgo de un escaneo, persistido con severidad, archivo, línea, identidad
estable y ciclo de vida (activo, extinto). Alias en español:
[hallazgo](#hallazgo).

### FORTRESS-NOTES
Bloques que un agente deja sobre FORTRESS mismo mientras trabaja en OTRO
proyecto (bug, gap, limitación, oportunidad). Van al backlog de auto-mejora
de FORTRESS, no al proyecto ajeno.

## G

### GATE (estado)
Estado de una propuesta cuyo fix pasó el gate hermético y espera el juicio
de OMEGA.

### Gate hermetico
Juicio mecánico del fix DENTRO del worktree: `npm ci` estricto + typecheck +
lint + test:unit, con timeouts por comando. Verde avanza; rojo rechaza con
autopsia (el worktree se conserva).

### Genesis
Bucle que entrena capacidades auto-propuestas por su cuenta, con topes de
coste obligatorios. El humano firma los agentes nuevos; OMEGA puede vetar.

## H

### hallazgo
Ver [finding](#finding).

## I

### identidad de un hallazgo

`fichero │ tipo │ símbolo`. La clave que decide si un hallazgo reportado es una
fila nueva o una que ya existía. **No** es la del `PTN-` de COGNITION ni la de
los descartes: tres claves distintas para tres preguntas distintas, tabuladas en
[DATA-MODEL](DATA-MODEL.md).

### isAbsoluteProjectPath
Guard de dominio: la raíz de un proyecto debe ser absoluta (POSIX, unidad de
Windows o UNC). Cierra rutas relativas hostiles al registrar u operar
proyectos. Comprueba el PREFIJO: no normaliza la cadena ni rechaza segmentos
`..`; ese rechazo lo añade encima el guard de la carpeta padre en el alta de
proyecto nuevo, y solo para ese flujo.

### isPrivateHost
Guard anti-[SSRF](#ssrf): rechaza loopback, rangos privados, link-local y
las formas equivalentes del mismo host (IPv4-mapped, hexadecimal, decimal).

## L

### Libro de vida
La tabla `proposal_events`: cadena append-only por propuesta, con secuencia
monótona. Asienta quién hizo qué, cuándo, con qué coste y con qué evidencia.
Telemetría paralela a la máquina de estados: registra, no valida.

### loopBlocked
Guard de dominio que impide el loop autónomo sobre el propio repo de
FORTRESS. Doctrina permanente, aplicada por capas independientes y
verificada en el binario.

## M

### MCP (Model Context Protocol)
Protocolo por el que FORTRESS consulta herramientas externas; el Knowledge
Graph (codebase-memory) se consume por MCP.

### MERGEADO
Estado terminal feliz: el fix fue firmado por el humano y mergeado
localmente. El push a [origin](#origin) sigue siendo humano.

## O

### OMEGA (estado)
Estado de una propuesta aprobada por el revisor semántico, esperando la
firma humana.

### OMEGA (veredicto de 6 ejes)
Evaluación del revisor semántico del motor: seis ejes como evidencia. La
conclusión global la recomputa el motor con reglas deterministas
([veredicto sintetico](#veredicto-sintetico)); una discrepancia queda
asentada como decisión.

### OMEGA veto
Dos usos distintos del veto: (1) [Sentinel OMEGA](#sentinel-omega) veta
promociones de capacidades por evidencia — veta, nunca aprueba; (2) el
revisor del motor puede dictaminar VETADO sobre un fix, lo que rechaza la
propuesta con razón persistida.

### Origin
El remoto git del proyecto. El motor NUNCA lo toca: el push es siempre un
acto humano, deliberado, en su terminal.

## P

### Path traversal
Ataque por rutas relativas (`../../`) para escribir o leer fuera del área
permitida. Bloqueado por guards de ruta absoluta y allowlist de nombres en
toda escritura originada por agentes.

### Preload
El puente tipado (`contextBridge`) entre renderer y proceso main: única vía
de comunicación, con API tipada compartida. La API key nunca lo cruza.

### Presupuesto por propuesta
Techo de tokens que una propuesta del motor puede gastar en total, con
mínimos reservados para el generador y el revisor. Superarlo rechaza la
propuesta antes de gastar más.

### PTN
Patrón de cognición registrado en el [COGNITION-LOG](#cognition-logmd)
(formato `PTN-AAAA-NNN`): detección, causa raíz (5 whys), prevención
implementada y verificación de extinción a 7/14/30 días.

## R

### RECHAZADO
Estado terminal con razón persistida. Las razones de razonamiento (veto del
revisor, violación de correa, sin diff, error del generador) admiten
reintento explícito — que crea una propuesta NUEVA con vínculo de linaje,
nunca reabre la vieja.

### repair-worktrees
Carpeta en los datos de la aplicación donde viven los
[worktrees](#worktree) del motor, fuera del árbol vivo de cada proyecto.

## S

### símbolo (de un hallazgo)

La función o bloque que contiene el defecto (`handleVerify`, `buildEnv`). Es lo
único de la ubicación que sobrevive a que el código de arriba crezca — la línea
del mismo agujero viajó de la 43 a la 59 en tres escaneos. Separa dos defectos
del mismo tipo en el mismo fichero.

### sin reconfirmar

Marca **derivada** del tablero: el último escaneo no volvió a nombrar ese
hallazgo. No cambia su estado ni lo saca de la cola del motor.

### safeStorage
Cifrado del sistema operativo (keychain) para la API key. Solo el proceso
main la descifra; el renderer únicamente puede preguntar si existe.

### Sandbox
Ejecución acotada para corridas de génesis y auto-creación: directorio
controlado, modo de solo-plan y guardas de corrida por proyecto.

### Sentinel OMEGA
El agente número 11: meta-auditor que verifica los veredictos del resto
contra el filesystem. Su carta: [testigo-no-actor](#testigo-no-actor),
evidencia-o-silencio, discrepancia-no-intención, falible-por-diseño.

### SOT (Source of Truth)
Fuente única de verdad de un dato. En FORTRESS cada dato tiene un dueño
único: el [libro de vida](#libro-de-vida) para el motor, el COGNITION-LOG
para los patrones, el expediente SQLite para los hallazgos.

### SSRF
Server-Side Request Forgery: inducir al sistema a hacer peticiones a hosts
internos. Mitigado con [isPrivateHost](#isprivatehost) en toda petición
saliente de auditoría externa.

### Superficie (surface)
Estimación numérica de cuán contenido es el fix de un hallazgo (aditivo y
con pocos controles = menor superficie). [C1](#c1-selecttarget) elige
siempre la menor: más contenido, más seguro de estrenar.

### Supersede
Una propuesta nueva sobre el mismo hallazgo deja obsoleta a la anterior. Lo
reemplazado no se reintenta: el reintento choca con la propuesta posterior.

## T

### tipo (de defecto)

La clase de defecto, elegida de un **vocabulario cerrado** por el escáner —
clasificar, no redactar. Es una de las tres piezas de la identidad. La lista
completa, con su regla de `otro`, en
[TAXONOMIA-DE-DEFECTOS](TAXONOMIA-DE-DEFECTOS.md).

### Testigo-no-actor
Principio de OMEGA: observa, verifica y puede VETAR; nunca ejecuta,
promociona ni se corrige a sí mismo. En cuanto "arregla" o "aprueba solo",
deja de ser testigo fiable.

### Trusted
Flag de confianza por proyecto (default: false). Habilita la
autoverificación por [allowlist](#allowlist) y el loop. Modelo
[Workspace Trust](#workspace-trust).

## V

### Veredicto sintetico
Conclusión derivada por el motor, con reglas deterministas, a partir de la
evidencia devuelta por un agente. No se confía en la conclusión literal del
modelo: los ejes son evidencia, la síntesis es del motor.

## W

### Worktree
Copia de trabajo de git aislada, creada sobre el [base_sha](#base_sha) de la
propuesta, donde el motor escribe y verifica. El árbol vivo del proyecto no
se muta hasta firma humana + merge.

### Workspace Trust
Modelo de confianza explícita por proyecto: sin declarar un proyecto
[trusted](#trusted), FORTRESS no auto-ejecuta nada en él.
