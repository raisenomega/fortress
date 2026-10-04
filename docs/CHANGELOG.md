# Changelog

FORTRESS aún no ha llegado a un release público. Este documento **no usa
números de versión**: registra hitos por fecha. Cuando el proyecto alcance un
release público se adoptará un esquema de versionado formal y este changelog se
convertirá a él.

## Cómo leer este documento

Los hitos van en **orden inverso** (el más reciente arriba). Cada entrada lleva
una o más **etiquetas de categoría**:

- **[Motor]** — el motor de auto-reparación disciplinada y sus eslabones.
- **[Escaneo]** — la auditoría: los agentes, el score, Sentinel Omega, la
  superficie externa.
- **[Sistema evolutivo]** — el grafo de conocimiento, el loop autónomo, el
  ciclo de capacidades, la génesis y el aprendizaje.
- **[Seguridad]** — guardas, aislamiento, la doctrina de cero telemetría, el
  bloqueo de push.
- **[Arquitectura]** — las decisiones estructurales, la persistencia, la
  comunicación entre procesos, la frontera con el proveedor, el tema visual y
  las vistas.
- **[Documentación]** — el plan documental por fases.

Los días sin un hito destacable no aparecen: el trabajo continuo entre hitos se
refleja en el hito siguiente. Cuando el método concentra varios hitos en una
misma fecha —como el cierre documental del 2026-08-11— se registran tal cual,
sin distribuir artificialmente. Cada entrada apunta al documento donde el hito
se narra o su decisión se registra: [HISTORY](HISTORY.md) ofrece la narrativa
general, [FLOWS/](FLOWS/SELF-REPAIR.md) describe los flujos operativos, y
[DECISIONS/](DECISIONS/README.md) contiene las ciento once decisiones
arquitectónicas.

## 2026-10-04/05 — La maratón del Motor

**[Motor]** **Primera jornada completa de reparación autónoma en producción**
(sábado 22:43 → domingo 14:18, hora del operador): **64 ciclos sobre 57
hallazgos, 155 corridas, $284.19**, sin interrupciones ni averías propias.
**40 fixes aprobados por OMEGA a la cola de firma — el estreno del CRITICAL
incluido** (`templates/fortress-orchestrator.sh:226`, el separador del
registro validado fallo-cerrado en los cuatro campos, +15/−0, aprobado a la
primera). 13 rechazos con ocho causas distintas, todas frenos y no averías
—entre ellas el **primer veto de OMEGA recomputado por ejes** (el revisor
dijo APROBADO, sus ejes decían PARCIAL+MAYOR, mandaron los ejes) y el primer
disparo EN VIVO del guard de ADR-102—; 9 fusiones de duplicados; cero
alertas de jaula y cero salidas de correa. Cuadre fila a fila contra la base
al cierre: ninguna propuesta perdida ni colgada. Capacidad de producción
PROBADA, no prometida.

## 2026-09-28 a 2026-10-04

**[Motor]** **La cura del perímetro y la escalera completa.** ADR-107 fija que
**el Motor es solo de FORTRESS** (la guarda en los dos nacimientos) y retira el
LOOP de raíz —62 módulos—; ADR-106 sube el debut a HIGH con la selección por
severidad, y su **enmienda firmada del 2026-10-04 abre el último escalón**: el
HIGH `9f69a37c` cruzó la cadena entera (gate verde, OMEGA aprobó, firma, merge
`2655c77`) y `DEBUT` quedó en **LOW→CRITICAL**, con CRITICAL siempre a firma.
ADR-110 le da al Motor su **lazo** (responde a la objeción de OMEGA con
`--resume`, freno en dólares) y su recibo persiste cada parada sin vuelta.

**[Motor]** **El ciclo de dependencias, cerrado end-to-end en producción.**
ADR-111 (la correa: el Motor regenera el lock con `npm install
--package-lock-only --ignore-scripts`, nunca los nativos) + ADR-112 (el prompt
viaja por **stdin**: el E2BIG de Linux y los 32 KB de argv de Windows ya no
tocan el transporte) + el acotado del expediente (32 KiB por fichero, §18): el
CVE de vitest `7a3711a7` pasó gate, **OMEGA aprobó su lock real por $1,31** y
la firma lo integró el último de su tanda (`dd3fa73`), como mandaba la guía.

**[Operador]** **La guía de firma estrenada con una tanda de diez**: orden
sugerido con las dependencias al final, sonda del árbol combinado con
bisección, y el par culpable nombrado con medidas; 8 de 10 en main, main nunca
en rojo.

**[Seguridad]** **El CRITICAL 351abcd1, multi-cliente, arreglado a mano** (la
vía diseñada: era defensa del Motor). El rig probó en vivo que los hooks del
`.claude/settings.json` de un repo auditado **disparaban FUERA de la caja**
—credenciales y red— y que su `apiKeyHelper` secuestraba la autenticación; el
arreglo (`--setting-sources user` sin confianza, en el cuello único
`buildArgs`) cierra el vector en todos los caminos y la caja `--settings`
sobrevive, medido con sonda (`b4bb975`).

**[Docs]** Barrido del «computador perdido» (2026-10-04): los seis documentos
que describían el LOOP como vivo quedan al día (DEUDAS §10.1 CERRADA), el
debut dice la escalera completa, e IPC/DATA-MODEL/GLOSSARY/OVERVIEW cuentan lo
que el código hace hoy.

## 2026-09-26

**[Terminal]** **La guarda de barrera cubre TODO turno que edita** (ADR-105,
`4dbaa1b`): el turno suelto, el lote y el workflow del chat cuando el proyecto
corre en autónomo por el CLI, y el Ejecutor de Construir siempre, negado sea
cual sea el modo y con recibo en el historial. **Y el recibo del bloqueo del
chat y del lote** (`1076666`): las tres puertas del envío niegan con su nombre,
la cola corta en la primera negativa, el negado no cuenta como procesado y el
parte persistido dice qué barrera está rota, con el intérprete que falta y el
que existe. La nota de barrera del sistema nervioso lleva los datos del cliente
saneados.

**[Seguridad]** **Los cuatro flujos que corrían en `plan` pasan a `lectura`**
(`22a5fdd`): Plan de Construir, entrevista de configuración, episodio de
aprendizaje y borrador del agente ven el grafo y pierden el Bash que `plan`
regalaba sin constar. **Lo limpio de la rama de limpieza, rehecho sobre main**
(`4dbf512`): el enlace colgante negado con `lstat` en `rutaContenida` (HIGH,
path-traversal fuera de la caja del CLI), cuatro reglas de forma de secretos
(AWS, Slack, JWT, PEM), el glob que redactaba el prompt, tres innegociables que
protegen a quien aplica la lista, siete de accesibilidad, y el saneado de
hermanos y símbolo en el prompt del analista.

**[Sistema nervioso]** **Construir y LOOP observan** (`2266922`, `ff59bcd`): los
tres prompts de Construir piden notas por bloque y las asientan pase lo que
pase; el loop asienta sus paradas y standbys del dato duro con dos áreas nuevas.
Cognition, el tribunal en el Ejecutor, el `stderr` y las notas al chat quedan
anotados con condición ([DEUDAS](DEUDAS.md) §6.6-6.10). **Arco #5 cerrado.**

**[Higiene]** **Cada gate escribía una sesión falsa en el COGNITION-LOG del
repo propio** (`2dfb070`): el cierre del escaneo solo escribe la memoria del
proyecto con lo VISTO (cero paradas, nada que afirmar). El gate lleva desde
entonces una cuarta prueba: el conteo de sesiones del log propio no cambia.

**[Base]** **Diez hallazgos de FORTRESS cerrados en la base viva**, nueve por
marcador verificado y el HIGH del enlace colgante por juicio; 46 vivos a 36,
otros proyectos intactos, backup validado.

## 2026-09-25

**[Grafo]** **El grafo por turno** (ADR-095 enmendado, `947be07`; `fd4b5c2`):
cada `claude -p` recibe una copia real del `.db` de su proyecto en un directorio
propio por `CBM_CACHE_DIR` en el `env` del servidor, en los dos caminos (CLI y
generador); el servidor rechaza con error legible cualquier otro proyecto, la
caché real no se toca y FORTRESS sigue indexando ahí. Cierra el gap de
aislamiento de la clase A ([DEUDAS](DEUDAS.md) §8.1). Binario reconstruido e
instalado en frío (`997e1e6b`, sobre `d8b0de6`: aún sin esta pieza).

## 2026-09-24

**[Grafo]** **Lo que el grafo no ve** (ADR-104, `a152a32`): el agente sabe qué
carpetas y ficheros no están indexados y qué barreras declara el proyecto.
**Higiene del índice** (`686b212`): `has_graph` refleja el índice en disco y se
realinea solo. **El juez huérfano** (`f836f14`): la suite de integración dejaba
un `claude -p` huérfano sobre el repo propio en cada corrida desde el 26-ago;
la parada se honra antes de reservar el carril, el hijo que nace parado muere al
nacer, y al salir la app mata a sus hijos. Documentación al día y siete
hallazgos cazados al ponerla ([DEUDAS](DEUDAS.md) §8).

## 2026-09-23

**[Escaneo]** **El contrato del hallazgo, cerrado**: la memoria del escáner y el
alias de clave (ADR-101, `aeb6b88`; el mismo defecto deja de nacer dos veces),
el ancla frente al arreglo (ADR-102, `5f76a44`; el guard antes del generador y
la pausa por huella de `.fortress/config`), la severidad de las familias de
auditoría (ADR-103, `fd9c2c9`). Anotados con dato: el defecto a propósito, las
cadenas de explotación y la línea que ya no es ([DEUDAS](DEUDAS.md) §6.3-6.5).

## 2026-09-22

**[Motor]** **El prompt refleja las capacidades reales** (`00656fa`): Bash se
lee de los argumentos, el vocabulario del grafo queda fijado a lo que el
servidor expone y el brief dice «no encontré». **Las 98 zombis con identidad
vieja**, reescritas (`b4eed4a`); **los hermanos por sede antes que por clase**
(ADR-099, `da5238e`); **seis tipos de auditoría** fuera de seguridad (ADR-100,
`bd51aee`), con el re-tipado de las 108 «otro» aplicado en la base viva.

## 2026-09-21

**[Seguridad]** **El sandbox** (ADR-092, `cd6a510`): los comandos de la clase B
corren en `bwrap` sin red salvo el puente al proxy, fail-closed si la caja no se
puede levantar; `npm ci` por el proxy medido en vivo. **ADR-098 firmado**: la
producción autónoma va bajo firma. **El pre-vuelo de barreras, ejercitado en
vivo**: el fail-closed negó la ejecución de un lote sobre una barrera muerta de
verdad (el plan negado costó 0,96 $).

## 2026-09-20

**[Seguridad]** **`--allowedTools` pre-aprueba; no deniega.** Medido con corridas
reales: con `--permission-mode default --allowedTools Read`, `Bash` se ejecutó
igual y `permission_denials` salió vacío. El docblock afirmaba lo contrario, y lo
repitieron el código, un test y quien escribió la pieza de encima. Quitar una
herramienta de verdad exige `--disallowedTools`, y desde hoy el modo `lectura` lo
lleva ([DEUDAS](DEUDAS.md) §4 y §8).

**[Escaneo]** **El escáner audita en `auditoria`, no en `plan`.** En `plan` el CLI
bloquea todas las llamadas MCP, así que el escáner llevaba el grafo encima y
auditaba a ciegas. Nace un cuarto modo de permisos: corre en `default`, el grafo
responde, `Bash` va entero y **escrito** en el allowlist —en `plan` ya corría,
regalado por el modo y sin constar en ninguna lista— y `Write`/`Edit` siguen
fuera. El juez de aplicabilidad pasa a `lectura`, y el chat supervisado entero
sale también de `plan` ([FUNCIONAMIENTO-ACTUAL](FORTRESS-FUNCIONAMIENTO-ACTUAL.md) §2.6).

**[Seguridad]** **El pre-vuelo de barreras.** Antes de un turno, el Terminal lee
los hooks `PreToolUse` que el proyecto del cliente declara y comprueba que su
intérprete existe. Si no existe, el hook nunca corre: el proyecto cree tener
guardia y no la tiene. La observación se asienta siempre; en autónomo y con un
lote, además, **bloquea** (ampliado a todo turno que edita el 26-sep, ADR-105).
Sin shell, porque el nombre sale de la configuración de un repo auditado.

**[Documentación]** `FORTRESS-FUNCIONAMIENTO-ACTUAL` puesto al día a `247611f`,
con sus 355 citas `fichero:línea` comprobadas por máquina —ocho estaban muertas,
entre ellas la de `protected-areas.ts`, borrado el 17-sep, que seguía sosteniendo
un freno por palabras que ya no existe—. La limpieza del auto-escaneo de ese día
quedó en una rama que main superó; su trabajo valioso se rehizo sobre main el
26-sep (ROADMAP #6).

## 2026-09-19

> Entre el 2026-09-13 y esta fecha el changelog no tiene entradas. Ese tramo
> —de ADR-088 a ADR-097, el Terminal que aprende a juzgarse— está narrado en
> [HISTORY](HISTORY.md), Acto 9.

**[Motor]** **Cuatro de los cinco defectos del primer ensayo autónomo, cerrados
en el orden fijado.** (1) La aprobación de OMEGA **caduca**: un plan nuevo
invalida el permiso viejo y el permiso se gasta al usarse —autoriza un intento,
no un resultado—. (2) El turno de plan corre en `lectura` y recibe su propia
instrucción: mandaba `supervisado`, el agente obedecía *«espera aprobación»* a
un humano que no estaba, y `plan` le mataba el grafo —el turno más caro del
lote, 5,02 $, planeó sin él—. (3) En autónomo el pie del hilo es texto plano con
el lote y su fase. (4) El grafo **no se indexa con un turno vivo**, y el lote
reconcilia al cerrar. El quinto sigue abierto ([DEUDAS](DEUDAS.md) §1).

## 2026-09-13

**[Motor]** El fix que **entra al repo marca su hallazgo**. Integrar no tocaba la
fila: el motor proponía, OMEGA revisaba, el operador firmaba, el merge entraba —
y el hallazgo seguía `ACTIVE`, contando para el score y pidiéndole trabajo al
motor otra vez. Lo marcaba el operador a mano, una a una, con el sha del arreglo.
Ahora lo hace `advanceProposal` al llegar a `MERGEADO`, que es donde convergen
las **tres** vías: la firma, la integración automática y el reconciliador de
huérfanos —ese tercero detecta con git un merge que entró sin que su propuesta se
enterara, y marcar en el merge lo habría dejado fuera—. No extingue: que un fix
entre no prueba que el defecto se fue, así que deja `MITIGATED`, el estado desde
el que la re-verificación cierra
([ADR-087](DECISIONS/adr-087-confirmar-un-hallazgo-exige-juicio.md)).

## 2026-09-12

**[Escaneo]** **Confirmar un hallazgo exige juicio.** El operador podía marcar
«ya está arreglado» pero no confirmarlo: los veintiséis mitigados del tablero
solo salían de su limbo pasando por el motor entero. Ahora un botón en la fila
lanza al analista sobre ESA fila, y hay tres desenlaces honestos: con marcador
comprobado el hallazgo **muere con juicio** y aterriza en su historia; sin
marcador **no muere** y queda dicho por qué; y si el analista dice que el
problema sigue, el hallazgo **vuelve solo a la cola del motor** —la marca era
falsa, y dejarla puesta lo mantenía contando para el score mientras el motor no
podía tocarlo—. Se separa la puerta de verificación de la de reparación sin
tocar la guarda `vivo`, y se verifica **sin crear propuesta**: una propuesta que
nunca quiso reparar ensucia la lista donde el operador mira lo que tiene que
firmar ([ADR-087](DECISIONS/adr-087-confirmar-un-hallazgo-exige-juicio.md)).

**[Escaneo]** **Lo cerrado tiene su página**, y dice de qué murió cada uno. El
tablero filtra los extintos a propósito y no había dónde volver a verlos. La
cabecera da **tres números y nunca uno**: de las cincuenta y seis extinciones de
hoy solo **nueve** las cerró un juicio; veinte son duplicados absorbidos por
ADR-084 y veintisiete se cerraron en agosto, cuando la ausencia extinguía —la
regla que mató dos hallazgos de la CSP por un comentario—. Un total único diría
«resuelto» de cuarenta y siete filas que nadie verificó. El clasificador va por
prefijo del motivo, porque la fusión escribe veinte cadenas distintas y
`ausencia_historica` tiene cero filas; y su cajón cae a `sin-prueba`, nunca a
`verificado`: un motivo desconocido no puede convertirse en una afirmación.

**[Sistema evolutivo]** El **Nivel 2 de la auto-mejora**: cuando la app se rompe,
se captura. Tres embudos — el del proceso principal, el del IPC (que envuelve el
registro en la raíz y cubre 94 de los 112 handlers sin editar ninguno de los 36
ficheros, ni el innegociable de ajustes) y el del renderer, construido y
**desconectado** porque su enganche cruza `preload/index.ts`. Se guarda la CLASE
del fallo —dónde, de qué tipo, qué operación—, nunca el `message`: diecisiete de
los que este código construye se interpolan y ocho concatenan hoy una ruta del
cliente. El texto crudo va al log local, que no viaja
([ADR-086](DECISIONS/adr-086-los-fallos-se-observan-por-su-clase.md)).

## 2026-09-02

**[Motor]** Retirar un proyecto ya no mata sus propuestas en silencio. Las que
siguen vivas **caducan con juicio** antes de que se suelte la fila —razón
`proyecto_retirado`, con su asiento en el Libro de la Vida— y solo después
limpia la cascada. El paso intermedio no es ceremonia: el parche de la propuesta
y su libro de eventos cuelgan de ella y mueren en la cascada un instante
después, así que el juicio únicamente sobrevive en la tabla que no tiene clave
foránea ([ADR-076](DECISIONS/adr-076-el-juicio-antes-de-la-cascada.md)). En la
misma vuelta, la reconciliación del arranque comprueba el proyecto **antes** que
el commit: una propuesta anterior a GENERATE cuyo proyecto desapareció ya no se
queda esperando a un operador que no tiene proyecto que mirar.

**[Arquitectura]** `repair_proposals` y `quality_scans` cuelgan por fin del
proyecto con `ON DELETE CASCADE`. Les faltaba la clave foránea por omisión y no
por decisión — sus ficheros de esquema eran los únicos que no argumentaban nada
al respecto—, y por ahí sobrevivió una propuesta a su proyecto durante catorce
días. Añadirla obligó a la segunda migración de **recambio de tabla** del
proyecto, que además borra las filas que la restricción nueva no admitiría; el
patrón y sus límites quedan fijados en
[ADR-077](DECISIONS/adr-077-cuando-una-migracion-deja-de-ser-aditiva.md), y
[ADR-036](DECISIONS/adr-036-sqlite-modular-migraciones-aditivas.md) recibe la
nota que le faltaba desde agosto.

**[Documentación]** El arco queda escrito en seis commits: las dos decisiones
nuevas, la referencia técnica al día —el esquema con sus claves en
[DATA-MODEL](DATA-MODEL.md), la salida del proyecto y el catálogo completo de
razones de la reconciliación en [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md), y el
contrato de `projects:remove` en [IPC](IPC.md)— y el Acto 7 de esta historia,
con lo que el arco apretó de paso.

## 2026-08-28

**[Escaneo]** La llave inglesa que marca un hallazgo como ya arreglado **vuelve
a existir**: pedía su nota con `window.prompt`, que Electron no implementa —
lanzaba una excepción que moría muda, así que el clic no hacía nada y nunca lo
había hecho. Ahora la pide un diálogo. De paso, el componente de modales pasa a
montarse por portal: era el primero que nacía dentro de una tabla y su texto se
salía de la caja, con todo el gate en verde
([ADR-075](DECISIONS/adr-075-el-modal-por-portal.md)).

**[Motor]** Las tres propuestas que llevaban semanas sin salida quedan cerradas,
cada una por su vía: la del veto con el botón nuevo, su hallazgo marcado con la
llave, y la huérfana —invisible para toda la interfaz, porque su proyecto se
había borrado— por el canal directo.

**[Documentación]** El Acto 6 queda documentado en ocho commits: cuatro
decisiones nuevas ([ADR-072](DECISIONS/adr-072-caducado-no-miente.md) a
[ADR-075](DECISIONS/adr-075-el-modal-por-portal.md)), la referencia técnica —los
diez canales que faltaban en [IPC](IPC.md), el ciclo de vida con su salida, y la
Capa 4 escrita por primera vez en [SECURITY-MODEL](SECURITY-MODEL.md)—, las
páginas que el operador lee, y esta narrativa.

## 2026-08-27

**[Seguridad]** El circuit breaker de la Capa 4 **tiene salida**. Su mensaje
prometía «revisa el detalle forense y desbloquéalo a mano» desde que existe, y
no había cómo: ningún SQL quitaba la marca, ningún canal lo intentaba, ninguna
pantalla lo ofrecía. Ahora un aviso en el expediente enseña el forense y, solo
tras verlo, permite desbloquear; la decisión queda asentada como acto humano
([ADR-074](DECISIONS/adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md)).

**[Sistema evolutivo]** Y el mismo breaker **frena el reindexado del grafo**, que
era la única acción que no lo consultaba: un proyecto contaminado se realineaba
igual, sobre todo al arrancar. El freno va en el embudo por el que pasan las tres
puertas, no en el handler
([ADR-073](DECISIONS/adr-073-el-freno-en-el-embudo.md)). Las dos mitades se
necesitan: frenar sin salida habría condenado el proyecto.

**[Motor]** Una propuesta viva **puede retirarse**. Hasta hoy solo sabía avanzar
—firmar, reintentar, o esperar a caducar—, y la que no admitiera ninguna de las
tres se quedaba viva para siempre con su hallazgo fuera de la cola. Retirar la
CADUCA con el motivo del operador, sin mentir sobre quién juzgó y sin bloquear el
hallazgo ([ADR-072](DECISIONS/adr-072-caducado-no-miente.md)).

## 2026-08-26

**[Motor]** El motor cierra sus propios arreglos: un drenaje volvió a mirar los
cuatro hallazgos que los fixes firmados el día anterior habían resuelto, y los
cuatro se extinguieron **con juicio y motivo escrito**. La vuelta completa
—detectar, reparar, firmar, volver a mirar, cerrar diciendo por qué— ocurre por
primera vez sobre el propio repositorio.

## 2026-08-25

**[Escaneo]** La identidad de los hallazgos anteriores al cambio de clave queda
reconciliada: una pasada de agente les asigna tipo y símbolo, y las que resultan
ser el mismo defecto se fusionan conservando la fila más antigua con su fecha de
nacimiento. La absorbida no se borra — se marca con quién se fusionó y sin fecha
de resolución, porque no se resolvió
([ADR-071](DECISIONS/adr-071-cuando-dos-filas-son-una.md)).

**[Motor]** Un hallazgo cuyo defecto ya estaba arreglado murió por primera vez
**con juicio**: cuatro extinciones motivadas en esa tanda, entre ellas la
relajación de la CSP. Es la red de «nada muere sin juicio» funcionando en el
sentido para el que se construyó.

**[Motor]** La transición que aprueba una propuesta persiste el veredicto que
recomputa el motor, no el que escribió el agente. Cuando el agente vetaba algo
que las cuatro reglas duras no vetan, la propuesta quedaba en un estado que dice
aprobada llevando dentro un veto, y tanto la firma como la integración
automática la rechazaban sin ruido. Es la familia de
[ADR-070](DECISIONS/adr-070-una-autorizacion-no-es-una-denegacion.md): la razón
decidiendo el qué.

**[Seguridad]** `push:run` comprueba que la carpeta del proyecto es la raíz de su
propio repositorio antes de empujar — una subcarpeta publicaría el repo padre
entero. Se le pregunta a git, no al remoto guardado en la base. El generador de
fixes deja de heredar el entorno del operador, y la salida del gate se redacta
antes de persistirse como evidencia.

**[Test]** El arnés de integración monta repositorios git reales. Montaba
carpetas —una función llamada `makeRepo` sin `git init`— y en cuanto esa guarda
preguntó por git se cayeron cinco comprobaciones a la vez: el choque semántico
que [ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md) había
dejado nombrado como no cubierto, esa misma madrugada. Una sexta llevaba tiempo
en verde sin probar nada —afirmaba que el error «ya no dice CRITICAL», lo que se
cumple con el push fallando por cualquier otra causa— y ahora afirma que el push
ocurre.

## 2026-08-24

**[Motor]** El cerco de integración automática mide el **resultado** antes de
integrar: si el fix dejara un archivo por encima del límite de líneas, no se
integra solo y espera firma. El gate corre dentro del worktree de la propuesta y
nadie medía el árbol ya integrado
([ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md)).

**[Motor]** El asiento de una integración deja de leer una autorización como una
denegación. La firma humana se registraba como «denegada por política» sobre
merges aplicados, y el fallo de git de una firma no se registraba en absoluto. La
vía —automática o firmada— entra en el asiento
([ADR-070](DECISIONS/adr-070-una-autorizacion-no-es-una-denegacion.md)).

**[Seguridad]** La lista de archivos que el motor no puede integrar sin que un
humano los mire cubre dos defensas más: la redacción de secretos antes de
persistirlos, y el armado del entorno y las herramientas de todo agente. Con un
criterio explícito que ya no depende de recordar categorías — si cambiar ese
archivo debilita una defensa, entra. Ver [SECURITY-MODEL](SECURITY-MODEL.md).

## 2026-08-23

**[Escaneo]** Un escaneo deja de extinguir hallazgos por ausencia. Lo que no
reconfirma sigue vivo y puntuando; la única vía de muerte es que un agente lo
juzgue obsoleto al drenar, y cada extinción registra su motivo. Nació de dos
hallazgos de la CSP que murieron porque un commit añadió un comentario a su
archivo ([ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md)).

**[Escaneo]** La identidad de un hallazgo pasa a `fichero │ tipo │ símbolo`. El
escáner clasifica sobre un [vocabulario cerrado](TAXONOMIA-DE-DEFECTOS.md)
derivado de los defectos reales del repositorio, en vez de que la clave dependa
del título que redacta distinto cada vez. Aplica hacia adelante
([ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md)).

**[Motor]** El tope por propuesta mide trabajo real —sin la re-lectura del
contexto, que era el 93-96% de lo que lo reventaba— y el generador lleva techo
de 30 turnos con desenlace propio al agotarlo
([ADR-068](DECISIONS/adr-068-tope-mide-trabajo-y-techo-de-turnos.md)).

**[Motor]** Un análisis que no se deja leer se registra como tal y ya no se
disfraza de hallazgo obsoleto
([ADR-066](DECISIONS/adr-066-analisis-ilegible-no-es-obsoleto.md)).

**[Seguridad]** Tres agujeros cerrados por el propio motor y firmados por el
operador, entre ellos `graph:verify` lanzando el CLI sin `guardRun`. Detalle en
[SECURITY-MODEL](SECURITY-MODEL.md).

**[UI]** El modo autónomo por fases completo: drenaje con confirmación de gasto,
[cola de firma en su página](PAGES/firma.md) con filas desplegables, y el
[expediente del motor](PAGES/motor.md) paginado. «Firmar» queda reservado para
lo que integra; en el gate el botón dice «Pedir revisión».

## 2026-08-11

El día más denso del proyecto: el último eslabón del motor y la totalidad del
cierre documental aterrizaron a la rama principal en la misma jornada.

- **[Motor]** Reintento explícito de propuestas rechazadas: implementado,
  firmado y mergeado. Un rechazo por razonamiento puede reintentarse creando
  una propuesta nueva con vínculo de linaje a la anterior; la vieja queda
  inmutable. Ver [FLOWS/RETRY](FLOWS/RETRY.md).
- **[Documentación]** Documentación del sistema pre-motor completa y mergeada:
  seis flujos operativos, las quince vistas de la interfaz y veintisiete
  decisiones retroactivas. El corpus público llega a noventa y dos archivos.
  Ver [HISTORY](HISTORY.md).
- **[Documentación]** Documentación del motor de auto-reparación mergeada:
  flujos, actores, modelo de datos, canales y las primeras treinta decisiones.
  Ver [HISTORY](HISTORY.md).
- **[Documentación]** Higiene estructural, documentos fundacionales —visión,
  arquitectura, principios, glosario y modelo de seguridad— mergeados en la
  misma jornada. Ver [HISTORY](HISTORY.md).

## 2026-08-10

- **[Motor]** Generación del fix en un worktree aislado sobre un ancla
  inmutable del repositorio, con una correa que limita los archivos que puede
  tocar. Ver [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).
- **[Motor]** Gate hermético: instalación limpia, verificación de tipos, linter
  y tests unitarios dentro del worktree, cada uno bloqueante.
- **[Motor]** Revisor semántico OMEGA: seis ejes de evaluación con veredicto
  recomputado por el motor. Ver [AGENTS](AGENTS.md).
- **[Sistema evolutivo]** Terminación por grupo de procesos del botón de
  detener, con escalada, para que ningún proceso hijo quede vivo tras parar.

## 2026-08-09

- **[Motor]** Primeros eslabones de la cadena de reparación: elegir el hallazgo
  de forma determinista y entenderlo contra el código vivo antes de generar.
  Ver [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md).
- **[Sistema evolutivo]** Reindexado automático del grafo de conocimiento al
  arrancar, al enfocar y bajo demanda. Ver
  [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

## 2026-08-08

- **[Escaneo]** **[Seguridad]** Endurecimiento a partir de los propios escaneos
  de FORTRESS sobre sí misma: se garantizó que un repositorio auditado no puede
  suplantar al auditor y se tapó un falso verde que dejaba pasar la prueba de
  integración por la capa equivocada.

## 2026-08-07

- **[Arquitectura]** **[Sistema evolutivo]** Detalle del ciclo de capacidades y
  generación verificada del documento de arquitectura de un proyecto en un
  sandbox aislado. Ver [FLOWS/CAPABILITIES](FLOWS/CAPABILITIES.md).

## 2026-08-06

- **[Sistema evolutivo]** Grafo de conocimiento cableado con enlace vivo al
  arranque de cada agente, guiado por rol. Consultar el grafo es dos órdenes de
  magnitud más barato que abrir archivos. Ver
  [FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

## 2026-08-04

Día pico de escritura del sistema pre-motor.

- **[Sistema evolutivo]** Ciclo de vida de capacidades con dos ejes
  ortogonales —fase por episodios, madurez por calidad—, gate por tipo de
  capacidad, y bucle de génesis con topes obligatorios en sandbox aislado. Ver
  [FLOWS/CAPABILITIES](FLOWS/CAPABILITIES.md) y [FLOWS/GENESIS](FLOWS/GENESIS.md).
- **[Sistema evolutivo]** Loop autónomo pre-motor con frenos de gasto y de
  ciclos, estado de espera resiliente y red de git para revertir. Ver
  [FLOWS/LOOP-VIEJO](FLOWS/LOOP-VIEJO.md).
- **[Sistema evolutivo]** Backlog de auto-mejora: los hallazgos sobre FORTRESS
  mismo se enrutan a un backlog propio.
- **[Escaneo]** Libro de la Vida de Sentinel Omega: un registro append-only que
  sobrevive al proyecto. Ver [AGENTS](AGENTS.md).

## 2026-08-03

- **[Escaneo]** Sentinel Omega, el undécimo agente y meta-auditor, con su carta
  de cuatro pilares y sus tres funciones deliberadamente rehusadas. Ver
  [AGENTS](AGENTS.md).
- **[Arquitectura]** Conectores de contexto externo con enlace vivo al arranque
  del chat, bajo una confianza por proyecto que por defecto es falsa.

## 2026-08-02

- **[Escaneo]** Escáner de seguridad real: hallazgos con evidencia persistidos y
  puntuados de forma determinista. Ver [FLOWS/SCAN](FLOWS/SCAN.md).
- **[Seguridad]** Un hallazgo de severidad crítica bloquea el push. Ver
  [SECURITY-MODEL](SECURITY-MODEL.md).
- **[Sistema evolutivo]** Detección del grafo de conocimiento y superficie
  externa: mirar la web de un proyecto desde fuera, sin atacarla.

## 2026-08-01

Origen del proyecto.

- **[Arquitectura]** Arranque con arquitectura de dominios estricta y un límite
  de setenta y cinco líneas por archivo verificado por la máquina; uso del
  intérprete de línea de comandos del agente en vez del SDK; comunicación entre
  procesos con un agregador central; y persistencia local en SQLite modular con
  migraciones aditivas. Ver [ARCHITECTURE](ARCHITECTURE.md).
- **[Seguridad]** La clave de la API se guarda cifrada con el almacenamiento
  seguro del sistema y jamás cruza al proceso de interfaz. Ver
  [SECURITY-MODEL](SECURITY-MODEL.md).
- **[Arquitectura]** Tema visual OMEGA y consola con modo supervisado y
  autónomo.

## Referencias

- [HISTORY](HISTORY.md) — la narrativa completa del proyecto.
- [DECISIONS/](DECISIONS/README.md) — las decisiones arquitectónicas
  (ADR-001 a ADR-087).
- [ROADMAP](ROADMAP.md) — las direcciones próximas.
