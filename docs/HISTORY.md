# Historia de FORTRESS

FORTRESS Command Center es una aplicación de escritorio que audita y mejora
código con agentes de IA disciplinados: escanea proyectos en busca de
hallazgos con evidencia, conversa con el operador, y —sobre su propio
repositorio— repara hallazgos por una cadena de juicios automáticos que
termina siempre en una firma humana. Este documento cuenta cómo se construyó,
desde el origen hasta el último hito cerrado.

**Método de este documento.** Las fechas se verifican contra el historial de
git del repositorio, no contra la memoria de las notas de trabajo. Los hitos
que aquí aparecen son cierres o firmas explícitas, no trabajo en vuelo. El
relato se organiza por temas con sus fechas reales, porque el desarrollo
avanzó por capas superpuestas y no por etapas estancas. La sección
**Presente**, al final, describe lo que se trabaja ahora sin comprometer
fechas. La primera versión de este documento cortaba el 2026-08-11; las etapas
posteriores se añaden por edición conforme cierran, y el relato llega hoy al
2026-09-13.

Los tres primeros actos —el proyecto entero hasta aquel primer corte— caben en
once días intensos: del 2026-08-01 al 2026-08-11.

## Acto 1 — Construcción de la plataforma pre-motor (2026-08-01 a 2026-08-08)

### Origen y decisiones fundacionales (2026-08-01)

FORTRESS nació el 2026-08-01 como un proyecto Electron con React y
TypeScript. Antes de la primera pantalla se tomaron dos decisiones que
marcaron todo lo demás.

La primera fue **arquitectura de dominios estricta con un límite de 75 líneas
por archivo** (ADR-031, ADR-032). El núcleo de dominio no depende de Electron,
React ni la base de datos; las dependencias apuntan siempre hacia adentro. El
límite de líneas no es cosmético: es la palanca que impide que un archivo
acumule responsabilidades. La regla firmada fue que el límite no se sube, se
divide. Un verificador automático la hace cumplir, de modo que la disciplina
no depende de la memoria de quien escribe.

La segunda fue **usar el intérprete de línea de comandos de Claude Code en vez
del SDK** (ADR-033). El agente tiene que ACTUAR en el filesystem del proyecto
—leer, editar, verificar—, no solo conversar. Se ejecuta el binario con el
directorio de trabajo apuntando a la carpeta del proyecto. Durante la
integración se descubrió que algunas banderas que se daban por sentadas no
existían; el spec era memoria aproximada y el comportamiento real mandó. Esa
lección —el código es la fuente de verdad— se repetiría a lo largo de todo el
proyecto.

A estas dos se sumó una tercera de seguridad: **la clave de la API se guarda
cifrada con el almacenamiento seguro del sistema operativo y jamás cruza al
proceso de interfaz** (ADR-034). Las llamadas al proveedor salen del proceso
principal; la clave no viaja por el puente.

### La consola que actúa con frenos (2026-08-01 a 2026-08-02)

Sobre esa base se levantó la consola. Un tema visual propio y coherente
(ADR-035), persistencia local en una base SQLite modular con migraciones
aditivas que nunca invalidan el esquema viejo (ADR-036), y un agregador de
comunicación entre procesos único y central, sin envíos a ciegas (ADR-037).
Cada proyecto vive aislado del resto: sus datos, su historial y su
configuración no se filtran a otro (ADR-038).

El 2026-08-02 llegó la pieza que convierte la consola en herramienta: el
**escáner de seguridad real**. No una plantilla de hallazgos, sino agentes que
leen el código y devuelven hallazgos con archivo, evidencia y severidad, que
se persisten y puntúan de forma determinista. Un hallazgo de severidad crítica
bloquea el push (ADR-039). Ese mismo día apareció la **superficie externa**: la
capacidad de mirar la web de un proyecto desde fuera, sin atacarla, para
describir su postura observable.

La consola aprendió a trabajar con frenos. El operador elige entre un modo
supervisado —el agente propone y espera— y uno autónomo, con una degradación
por petición que baja el permiso cuando el contenido del mensaje lo pide
(ADR-040). El agente que edita se autoverifica corriendo una lista corta de
comprobaciones (verificación de tipos, linter, tests) antes de dar un cambio
por bueno (ADR-041). Y se firmó una regla de higiene: no se añaden
dependencias nuevas sin justificación (ADR-042).

Alrededor del escáner creció el resto de la consola operativa: un historial de
escaneos por proyecto, un registro de actividad transversal, paneles de
rendimiento y de aprendizaje acumulado, y flujos de trabajo orquestados que
despachan a varios agentes en una sola corrida según la intención del
operador. Cada corrida de un agente asienta su factura real de tokens, coste y
duración; el gasto se lee del registro estructurado, nunca de una estimación.

Al cierre de estos dos días FORTRESS ya era la consola que el plan original
pedía, y algo más: una consola que actúa con frenos.

### Los agentes y el meta-auditor Sentinel Omega (2026-08-03 a 2026-08-04)

El escaneo se apoya en once agentes de auditoría especializados —revisor de
seguridad, revisor de código, limpiador de higiene, guía de tests,
planificador y otros—. La decisión de fondo fue tratarlos como **catálogo de
datos con un generador común de prompts**, no como un archivo de configuración
por agente (ADR-045). Diez de ellos derivan su prompt de su nombre y propósito
más un código de conducta compartido —todo hallazgo con evidencia, honestidad
en ambas direcciones, las zonas críticas no se tocan sin explicar el impacto—.
La identidad que el operador ve en la barra lateral y la que el agente recibe
en su prompt son la misma por construcción: no pueden divergir.

El 2026-08-03 se cablearon los **conectores de contexto externo** con enlace
vivo al arranque del chat (ADR-043), bajo una confianza por proyecto que por
defecto es falsa —el modelo de confianza de espacio de trabajo (ADR-044)—.

Y ese día nació el personaje central de la auditoría: **Sentinel Omega**, el
undécimo agente, un meta-auditor que contrasta lo que reportan los demás
contra el filesystem real. Su carta tiene cuatro pilares —testigo que observa
y veta pero nunca actúa, evidencia o silencio, discrepancia y no intención,
falible por diseño— y, tan importante como lo que se le da, tres cosas que se
le rehusaron a propósito porque lo harían violar lo que vigila: un interruptor
que mienta, el pensamiento inferido y el veredicto infalible (ADR-046). El
2026-08-04 se le añadió su Libro de la Vida: un registro append-only que
sobrevive al proyecto. Su regla de alcance quedó grabada: OMEGA solo puede
FRENAR; quien promueve es el gate por riesgo.

### El grafo, el loop autónomo y los dos bucles de aprendizaje (2026-08-04 a 2026-08-06)

Para que los agentes navegaran el código sin quemar presupuesto se cableó un
**grafo de conocimiento** servido por un conector de memoria de código
(ADR-048). Consultar el grafo cuesta unos ciento cincuenta tokens; abrir un
archivo entero cuesta entre cinco mil y cincuenta mil. Sin esa diferencia el
proyecto sería insostenible en coste. El grafo guía por rol: el revisor de
seguridad localiza, el estructural rastrea.

Se firmó también la forma en que el sistema aprende: **dos bucles separados**
(ADR-047). El bucle técnico es la autoverificación del agente tras editar, que
cierra la calidad de cada cambio sin intervención humana. El bucle cognitivo
es la reflexión: tras cada escaneo, el motor —no el modelo— reescribe de forma
determinista la memoria del proyecto. No se mezclan: uno cierra calidad, el
otro persiste memoria entre sesiones.

Sobre esto se construyó un **loop autónomo** pre-motor (ADR-049): un ciclo de
escaneo, arreglo, verificación y re-escaneo con frenos obligatorios de gasto y
de número de ciclos, parada automática tras varios rechazos consecutivos, un
estado de espera resiliente que reanuda tras reiniciar la aplicación, y una red
de git para revertir. Cuando el loop degrada un resultado, un debate entre juez
y defensa lo dirime, y el juez es el re-escaneo objetivo, no una opinión. Este
loop arregla, no solo audita; es el antecesor directo del motor disciplinado
que vendría después.

### El ciclo de capacidades y la génesis (2026-08-04 a 2026-08-08)

El salto conceptual de esta etapa fue que todo lo que FORTRESS hace de punta a
punta debe servir para mejorarse a sí misma. Mientras los agentes trabajan en
otros proyectos, descubren límites, bugs y oportunidades de FORTRESS mismo. Ese
material se captura y se enruta: lo que es del proyecto auditado va al proyecto;
lo que es de FORTRESS va a un backlog propio de auto-mejora (ADR-050).

De ese backlog nace un **ciclo de vida de capacidades** con dos ejes
ortogonales (ADR-051): la fase avanza por episodios reales acumulados —de
propuesta a prueba, luego a ciclo y finalmente a oficial, con umbrales
crecientes de episodios que se cuentan desde el registro de corridas y no desde
una casilla— y la madurez se deriva de la calidad observada, nunca
autoasignada. Sobre él, un gate por tipo de capacidad (ADR-052): lo reversible
—una función, una herramienta— puede avanzar solo; un agente nuevo exige firma
humana. Los agentes que nacen así son datos en la base, no código generado a
ciegas (ADR-053). El propio Sentinel Omega vigila estas promociones: puede
frenarlas con evidencia, pero nunca las concede.

El motor que ejercita capacidades por su cuenta es la **génesis**, un bucle con
topes obligatorios de gasto y de episodios que corre en un sandbox aislado del
proyecto real (ADR-054). Ninguna de estas piezas existe sin su freno.

Los días 2026-08-07 y 2026-08-08 se dedicaron al **endurecimiento**: los
propios escaneos de FORTRESS sobre sí misma encontraron hallazgos que se
cerraron con tests de regresión, entre ellos garantizar que un repositorio
auditado no pueda suplantar al auditor y tapar un falso verde que dejaba pasar
la prueba de integración por la capa equivocada. La plataforma pre-motor quedó
completa y probada.

### La doctrina transversal: privacidad y frontera con el proveedor

Dos decisiones atraviesan toda la plataforma. La primera es la **cero
telemetría** (ADR-056): FORTRESS no envía datos de uso a ninguna parte; el
libro de vida y los registros son locales y nadie más los ve. La ausencia de
un interruptor de telemetría en los ajustes no es un olvido: es la prueba viva
de la doctrina, no hay nada que apagar porque no hay nada que enviar. La
segunda es una **frontera única con el proveedor de IA** (ADR-057): todo lo que
FORTRESS pide al modelo pasa por un puerto de dominio con un contrato estable,
de modo que el resto del sistema no conoce al proveedor concreto y cambiarlo no
obliga a reescribir la lógica.

A esto se suma la forma en que nace un proyecto nuevo dentro de FORTRESS: una
**configuración guiada** (ADR-055) que entrevista al operador y redacta el
marco de documentos de gobierno del proyecto. Todo nombre y toda ruta que
propone el agente se tratan como entrada no confiable —lista de permitidos y
guardas contra escapes de ruta— antes de escribir nada al disco.

## Acto 2 — El motor de auto-reparación disciplinada (2026-08-09 a 2026-08-11)

Con la plataforma construida, del 2026-08-09 al 2026-08-11 se levantó el
capítulo más exigente: un **motor de auto-reparación disciplinada** que repara
hallazgos del propio repositorio por una cadena de juicios automáticos. La
filosofía en una frase: el motor propone, el humano dispone. Su historia
detallada y su modelo de decisiones viven en veintinueve registros de decisión
(ADR-001 a ADR-030) y en el flujo documentado en `FLOWS/SELF-REPAIR.md`.

La cadena tiene cinco eslabones automáticos antes de la firma. **Elegir** el
próximo hallazgo de forma determinista, prefiriendo la menor superficie de
cambio. **Entender**: un agente de solo lectura verifica que el hallazgo sigue
siendo real contra el código vivo, no solo contra el grafo, y caduca la
propuesta si ya no aplica. **Generar** el fix mínimo dentro de un worktree
aislado creado sobre un ancla inmutable del repositorio, con una correa que
limita qué archivos puede tocar y un presupuesto duro de tokens por propuesta.
El **gate hermético** corre en ese worktree los mismos comandos que correría
un humano —instalación limpia, verificación de tipos, linter y tests
unitarios— cada uno bloqueante. Y el **revisor OMEGA**, un agente semántico
independiente, juzga en seis ejes si el fix resuelve el hallazgo con calidad y
sin daño colateral; el motor recomputa el veredicto global desde los ejes, y
si difiere del que el agente reportó, manda el cómputo del motor.

Solo entonces interviene el humano. La firma exige que el repositorio no se
haya movido bajo la propuesta —si se movió, la propuesta caduca, nunca hay
rebase automático—, hace un merge local explícito, y deja el empuje al remoto
siempre en manos humanas. Un guard de dominio, verificado en el binario
distribuido, impide que FORTRESS se auto-repare sobre su propio código en
caliente: la reparación del propio FORTRESS existe, pero como flujo con firma
humana y reconstrucción en frío, nunca como loop autónomo.

Los eslabones se cablearon por incrementos: el 2026-08-09 nacieron los
primeros —elegir y entender— junto al reindexado automático del grafo; el
2026-08-10 llegaron la generación en worktree, el gate hermético y el revisor
semántico. El motor se probó de punta a punta en vivo sobre un hallazgo de baja
severidad —un directorio padre sin validar que permitía crear carpetas
arbitrarias—. Lo verificó como real contra el código vivo, generó un fix mínimo
de pocas líneas que reutilizó un guard ya existente en el dominio, hallado a
través del grafo; pasó el gate con todos sus tests en verde; y el revisor lo
aprobó dejando además documentado un riesgo residual honesto —un caso que el
fix no cubría— que exigía decisión humana. El coste total cupo con holgura
dentro del presupuesto por propuesta, y toda la evidencia quedó asentada en su
libro de vida. El caso se detalla en `FLOWS/SELF-REPAIR.md`.

El 2026-08-11 se firmó el último eslabón de este capítulo: el **reintento
explícito de propuestas rechazadas** (`FLOWS/RETRY.md`). Cuando una propuesta
se rechaza por razones de razonamiento, el operador puede reintentarla; el
reintento crea una propuesta nueva sobre el estado actual del repositorio, con
un vínculo de linaje a la anterior, y la vieja queda intacta como historia. Los
estados terminales no se reabren jamás. Con esa firma, el motor quedó completo
y mergeado a la rama principal. Los agentes y actores del motor se describen en
`AGENTS.md`.

## Acto 3 — El ciclo de documentación retroactiva (2026-08-11)

Construido el sistema, el 2026-08-11 FORTRESS se volvió sobre sí misma para
**documentarse**. El principio que lo obliga ya estaba firmado desde el propio
desarrollo: sin documentación no hay merge. La prueba que se aplica en cada
cierre es directa: si se perdiera hoy el equipo, ¿podría otro ingeniero
reconstruir el sistema desde el repositorio?

El método fue disciplinado y se repitió tarea a tarea: inventario primero
—leer el código real antes de escribir una línea—, pausa para firma, escritura
después, y verificación de que nada interno se filtra al corpus público. Una y
otra vez el código corrigió los supuestos del plan: la memoria del proyecto era
aproximada y el código era la verdad. De ese proceso emergieron principios de
método que el propio corpus registra y que ninguna sesión borra.

Entre los principios que este ciclo dejó firmados: distinguir siempre el estado
presente del estado de diseño, para no describir como real lo que aún es plan;
no creerle a un agente por fe, sino verificar su factura de tokens, los
archivos que tocó y su veredicto contra fuentes duras; auditar los patrones
transversales por barrido programático y no por memoria; y publicar por clase,
no por ubicación, cuando el dato podría enseñar a un atacante dónde mirar. Cada
consolidación de fase incluyó, además, un barrido de las referencias cruzadas
para que ningún documento prometiera un hermano que ya existía ni ocultara uno
genuinamente pendiente.

El plan documental se organiza en seis fases (Fases 0 a 5), y estas sí son
públicas y consistentes con el índice de la documentación. La Fase 0 fue de
higiene estructural. La Fase 1 escribió los documentos fundacionales —visión,
arquitectura, principios, glosario y modelo de seguridad—. La Fase 2 documentó
el motor de auto-reparación. La Fase 3 documentó el sistema pre-motor completo:
los flujos de escaneo, chat, loop, postura, capacidades y génesis; las quince
vistas de la interfaz; y veintisiete registros de decisión retroactivos que
completan el corpus hasta cincuenta y siete. Al corte de esta versión, las
Fases 0 a 3 están mergeadas a la rama principal, con veintisiete de treinta y
dos tareas completas.

## Cierre — el doble hito del 2026-08-11

El 2026-08-11 concentró dos firmas que cierran el ciclo pre-motor. Por un lado,
el reintento explícito quedó firmado y mergeado: el motor de auto-reparación
tiene ya su cadena completa, con recuperación disciplinada de los rechazos por
razonamiento. Por otro, la documentación del sistema pre-motor quedó completa y
mergeada, llevando el corpus público a noventa y dos archivos.

La suma de las dos firmas es el significado del hito: un motor de
auto-reparación con reintento funcional, y un corpus documental que lo sostiene
y explica, construido con la misma disciplina de inventario y verificación con
que se construyó el sistema. El sistema no solo funciona; puede reconstruirse
desde su documentación.

## El día siguiente: integración y armonización (2026-08-12)

El plan documental se cerró al día siguiente con los documentos operativos —cómo
contribuir, cómo montar un entorno, cómo resolver problemas y cómo distribuir—.
Con el corpus completo quedaba la pieza que lo justificaba: que el propio sistema
supiera que existe. Los agentes recibieron una referencia a `docs/` en su prompt,
distinta según el trabajo de cada uno: quien decide dónde va un cambio consulta la
arquitectura y las decisiones firmadas; quien juzga seguridad, el modelo de
amenazas. No se les copió la doctrina al prompt: se les enseñó dónde vive y cómo
pedirla.

Esa integración destapó las deudas que el propio corpus había ido acumulando, y
saldarlas ocupó el resto del día: comentarios del código que citaban como fuente
un archivo que no viaja en el repositorio, referencias que anunciaban como
pendientes documentos ya escritos, una alerta de dependencias, y un defecto por el
que los avisos idénticos se apilaban en la interfaz en lugar de agruparse —
arreglado en el almacén de avisos, de modo que valga para todos los emisores y no
solo para el que lo destapó.

El último hallazgo llegó al reconstruir el binario. La verificación del paquete
descubrió que un patrón de exclusión obsoleto —nombraba una carpeta que se había
renombrado tiempo atrás— dejaba pasar la carpeta interna del operador al
instalable, pese a estar correctamente excluida del repositorio. Se corrigió, y la
lección quedó firmada como decisión arquitectónica: cada capa de exclusión declara
su propia lista y ninguna hereda de otra. Ver
[DECISIONS/](DECISIONS/adr-058-capas-de-exclusion-explicitas.md) y
[RELEASE](RELEASE.md).

## Acto 4 — El motor trabajando de verdad, y lo que enseñó (2026-08-19 a 2026-08-23)

El motor dejó de ser un diseño y pasó a correr sobre el propio repositorio en
tandas largas. Casi todo lo que se aprendió vino de mirar sus facturas y sus
muertes, no de razonar sobre el diseño.

**El modo autónomo por fases.** Una vuelta puede parar antes del juicio, después
del juicio, o llegar hasta el final ([ADR-061](DECISIONS/adr-061-modo-autonomo-con-la-disciplina-del-motor.md)).
Sobre eso se construyó el drenaje —recorrer todos los elegibles y dejar cada fix
esperando firma— con su confirmación de gasto y la cola de firma en
[su propia página](PAGES/firma.md). Faltaba la puerta: la doctrina prometía que
nada entraba sin firma humana y no existía ningún camino de código que la
ejecutara. Dieciséis propuestas aprobadas llevaban días atascadas sin poder
integrarse.

**El contador que tiraba el trabajo pagado.** Cuatro fixes terminados, con sus
tests y dentro de su perímetro, se descartaron por exceder un tope de dos
millones de tokens. Al desglosar la factura, entre el 93% y el 96% de lo que
reventaba el tope era contexto releído, el token más barato que existe. El
trabajo real de los cuatro estaba entre 128k y 213k. El tope no medía trabajo:
medía contexto por turnos ([ADR-068](DECISIONS/adr-068-tope-mide-trabajo-y-techo-de-turnos.md)).

**Tres agujeros de seguridad cerrados por el propio motor**, firmados uno a uno
por el operador. El primero costó seis intentos — tres murieron por ese contador
mal medido. Están en [SECURITY-MODEL](SECURITY-MODEL.md).

**Y la lección más cara: nada muere sin juicio.** Un escaneo que no volvía a
nombrar un hallazgo lo daba por resuelto si git veía que su archivo había
cambiado. La segunda prueba nació de un incidente real y parecía suficiente,
pero preguntaba por el archivo y no por la línea: en un repositorio activo se
cumple sola. Mató dos hallazgos de la CSP porque un commit añadió un comentario;
la relajación que denunciaban seguía en `main`. Desde entonces el escaneo no
cierra nada y la única vía de muerte es que un agente lo mire
([ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md)).

Eso destapó lo siguiente: si nada muere, el mismo defecto no puede seguir
abriendo fila nueva cada vez. La identidad dependía del título, que el escáner
redacta distinto en cada corrida —y al medirlo, la severidad y la línea
resultaron igual de inestables—. Ahora es fichero, tipo y símbolo, con un
[vocabulario cerrado](TAXONOMIA-DE-DEFECTOS.md) derivado de los defectos reales
del repositorio ([ADR-067](DECISIONS/adr-067-identidad-fichero-tipo-simbolo.md)).

## Acto 5 — Los estados dejan de mentir (2026-08-24 a 2026-08-25)

El acto anterior enseñó a mirar las facturas y las muertes del motor. Este vino
de mirar lo que el motor **escribía** de sí mismo, y de encontrar que en varios
sitios no era verdad.

**Empezó con el escáner mudo.** Una caída del proveedor —un 529 persistente,
específico de la combinación de flags con la que el motor lanza sus agentes—
había dejado al escaneo sin poder correr. Cuando se soltó, el escaneo volvió con
su patrón bueno: siete hallazgos, todos clasificados, y su factura legible por
primera vez desde que existe la columna que la registra.

**La lista innegociable se había quedado corta por tercera vez, y por el mismo
motivo.** La protección seguía al nombre del archivo y no a su responsabilidad,
así que dos defensas de seguridad estaban fuera: la que tacha los secretos antes
de que se persistan, y la que arma el entorno y las herramientas de todo agente.
Entraron con un criterio explícito que ya no depende de recordar categorías: si
cambiar ese archivo debilita una defensa, entra, sea de la familia que sea. Está
en [SECURITY-MODEL](SECURITY-MODEL.md).

**Después, el cerco aprendió a mirar el resultado.** El gate corre dentro del
worktree de la propuesta y da verde sobre un árbol donde el fix está solo; nadie
mide el árbol ya integrado. Con veintitrés archivos de este repositorio en 75
líneas justas, una sola línea rompe el lint. Se añadió una sexta condición: si
el fix dejara un archivo por encima del límite, no se integra solo — va a la
firma, donde alguien puede partirlo antes
([ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md)).

El incidente que lo destapó **no es de los que esa condición evita**, y conviene
decirlo: dos propuestas nacidas de la misma base llevaron `claude-cli.ts` de 74 a
75 líneas cada una, las dos legales en su worktree, y el merge lo dejó en 76.
Cada fix era correcto; la suma no. Cerrar esa mitad es detección posterior a la
integración, y sigue pendiente.

**Y la lección del acto: una autorización no es una denegación.** El asiento que
OMEGA escribe por cada integración decidía si algo se había denegado preguntando
si la política traía texto. La firma humana traía el suyo —un porqué afirmativo
en un campo que el tipo documenta como «por qué NO se integra»—, así que **once
asientos del Libro dicen "denegada" sobre integraciones que están en `main`**,
con el sha en su propia evidencia al lado. Y cortar ahí dejaba sin registrar el
fallo de git de una firma: el Libro entero no tenía un solo asiento citando a
git, con dos firmas que sí habían fallado
([ADR-070](DECISIONS/adr-070-una-autorizacion-no-es-una-denegacion.md)).

Es la forma de [ADR-059](DECISIONS/adr-059-capas-de-estado-no-heredan.md)
aplicada a un solo campo: la razón estaba decidiendo el qué. Los once asientos
seguirán ahí —el Libro es append-only por diseño—, y lo que queda por decidir no
es el arreglo sino cómo se anota una rectificación en un registro eterno.

**La Fase B de la identidad, que el acto anterior dejó prometida.** Las filas
anteriores al cambio de clave conservaban la fórmula vieja y no podían empatar
con la nueva: cada escaneo abría fila junto a una que ya no muere. Re-escanear no
lo arregla —está demostrado— y una migración determinista tampoco puede: el tipo
lo elige un modelo de un vocabulario cerrado. Se hizo en tres piezas, con la
clasificación deliberadamente separada de la escritura para que la parte no
determinista quedara fuera de la irreversible. Diecisiete filas reclasificadas,
cuatro fusiones, cinco absorbidas
([ADR-071](DECISIONS/adr-071-cuando-dos-filas-son-una.md)).

**Y aquí el acto anterior tenía escrita una promesa que resultó falsa.** Decía
que quedaba «revivir los tres hallazgos que murieron mal». Eran **cuatro**, y al
juzgarlos uno a uno contra el código **ninguno debía revivirse**: los cuatro
tenían su defecto ya arreglado, y devolverlos a la vida habría puesto en el
tablero problemas que no existen. Tres de ellos, además, habían muerto
correctamente. La regla vale en los dos sentidos — nada muere sin juicio, y nada
revive sin él tampoco. Lo que sí les falta, y sigue faltándoles, es una razón de
muerte registrada.

**El drenaje puso todo a prueba sobre hallazgos frescos**, y en él la red del
acto anterior hizo su primer trabajo real: **cuatro hallazgos extinguidos con
juicio** en esa tanda, entre ellos la relajación de la CSP que llevaba días
señalada como el caso perfecto — un defecto ya arreglado en el código cuyo hallazgo seguía vivo
porque, desde que el escaneo dejó de matar por ausencia, solo un agente que lo
mire puede cerrarlo. Lo miró y lo cerró.

Y el arreglo del veredicto se comprobó solo: la primera integración firmada
después de él asentó **«Integración firmada aplicada»**, con su veredicto
correcto y su commit. Es el primer asiento de integración aplicada de la historia
del proyecto — antes no había ninguno, porque todos decían lo contrario.

### El desenlace: cuatro firmas, una grieta prevista, y el ciclo cerrándose

El 2026-08-25 el operador firmó **cuatro** de los fixes que el drenaje había
dejado esperando, y el Libro los asentó como lo que eran. Cinco asientos honestos
donde antes había once que decían lo contrario.

**Y uno de los cuatro rompió `main`.** El fix que hacía que `push:run` preguntara
a git si la carpeta del proyecto es la raíz de su repositorio —para no publicar
el repo padre— entró firmado, con su gate en verde, y tumbó cinco comprobaciones
de integración. No porque el fix fuera malo: porque el arnés de pruebas montaba
proyectos que no eran repositorios, y mientras ninguna guarda preguntó por git,
nadie lo notó. Una función llamada `makeRepo` llevaba meses creando una carpeta
con un fichero dentro.

**Eso es exactamente el hueco que [ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md)
había nombrado esa misma madrugada**, veinte horas antes: el gate mide la
propuesta en su worktree y nadie mide el árbol integrado; la sexta condición
cubre el tamaño, y el choque semántico —un fix que rompe algo del árbol sin
añadir una línea de más— queda fuera. El documento decía que esa mitad estaba sin
cubrir, y la mitad sin cubrir se manifestó el mismo día. No es un fracaso del
sistema: es el sistema enseñando su propia grieta donde ya la había señalado, y
con eso deja de ser una hipótesis del ADR para ser un caso.

Se arregló el arnés —los proyectos temporales son repositorios de verdad, como en
producción— sin tocar la guarda: un guard de seguridad con un escape para los
tests es un guard con un agujero. De paso apareció una comprobación que llevaba
tiempo en verde sin probar nada: afirmaba «el error ya no dice CRITICAL», y eso
se cumple en cuanto el sistema falla por cualquier otra razón. Pasó a afirmar que
el push **ocurre**.

**Y el arco cerró con un defecto de la misma familia que todo lo demás.** La
transición que aprueba una propuesta decidía con el veredicto que recomputa el
motor —los ejes son evidencia, la regla es código— y **guardaba el del agente**.
Cuando los dos coinciden da igual; cuando el agente veta algo que las cuatro
reglas duras no vetan, la propuesta quedaba en un estado que dice aprobada
llevando dentro un veto, y las dos puertas de integración la rechazaban sin
ruido: ni avería, ni aviso, ni rechazo visible. Se quedaba en la cola con aspecto
de firmable, para siempre. Una de 43 lo estaba, y sigue estándolo: el arreglo va
hacia adelante, y su evento ya escrito no se reescribe.

**El ciclo se cerró entero al día siguiente.** Un segundo drenaje volvió a mirar
los cuatro hallazgos que aquellos fixes habían arreglado, y los cuatro murieron
**con juicio y con motivo escrito**. Detectar, reparar, firmar, volver a mirar,
confirmar que ya no está, y cerrarlo diciendo por qué. Es la primera vez que la
vuelta completa ocurre sobre sus propios arreglos.

## Acto 6 — Las salidas que faltaban (2026-08-27 a 2026-08-28)

Los actos anteriores enseñaron al sistema a **entrar** en sus estados y a
escribir la verdad sobre ellos. Este vino de preguntar cómo se **sale**, y de
encontrar que en tres sitios no se salía.

Tres arcos del mismo diagnóstico —un estado sin salida— y un cuarto que es la
misma lección cobrada al revés.

### La llave: contaminar tenía entrada y no tenía salida

El circuit breaker de la Capa 4 marca un proyecto CONTAMINADO cuando una
auditoría lo deja alterado y las capas de restauración no lo devuelven
byte-idéntico. Su mensaje llevaba desde que existe diciendo *«revisa el detalle
forense y desbloquéalo a mano»*.

**No había cómo.** `markContaminated` era el único escritor de la columna y
siempre escribía una fecha; ningún SQL del repositorio la ponía a NULL, ningún
canal lo intentaba, ninguna pantalla lo ofrecía. Un proyecto marcado quedaba
bloqueado para siempre, y la promesa del mensaje era falsa.

Se construyó en tres piezas el 2026-08-27: el mecanismo (`markClean`, `8017579`),
el canal con su asiento (`d35cf6d`) y la cara —un aviso en el expediente que
enseña el **forense** antes de dejar confirmar (`7295de6`)—. El asiento de esa
decisión se registra como acto humano y no como verificación: FORTRESS no
comprueba que el árbol esté limpio, registra que alguien miró y cargó con ello
([ADR-074](DECISIONS/adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md)).

### El cerrojo, y por qué necesitaba a la llave para ser seguro

El freno de contaminación existía en las acciones —`guardRun`, `guardMerge`— y
**no en el reindexado del grafo**. Un proyecto marcado se reindexaba igual por
sus tres puertas, y sobre todo al arrancar, que es donde nadie mira.

El propio motor lo había detectado meses antes y propuesto un fix que ponía el
freno en el handler: dos rutas de tres, dejando fuera la del arranque. El
analista escribió entonces que el arreglo más ancho *«debe asumirse a
conciencia, no como efecto colateral»*, y la propuesta no se integró — con razón,
porque **sin desbloqueo, frenar el reindex habría condenado al proyecto para
siempre**.

Con la llave puesta esa misma mañana, el cerrojo pasó a ser seguro. Se puso en
el embudo por el que convergen las tres rutas (`0e8567f`), no en el handler
([ADR-073](DECISIONS/adr-073-el-freno-en-el-embudo.md)). Los dos arcos se
sostienen mutuamente: frenar sin salida condena, y una salida sin freno no
protege nada.

### La retirada: una propuesta viva solo sabía avanzar

Firmar, reintentar, o esperar a que el motor la caducara. La que no admitiera
ninguna de las tres se quedaba viva para siempre, y con ella su hallazgo fuera
de la cola.

La transición no era el obstáculo —`CADUCADO` ya era legal desde los seis
estados vivos—; faltaba quién la ejerciera. Tres piezas el mismo 2026-08-27: el
mecanismo (`231fbce`), el canal (`0fd9d1b`) y el botón con su confirmación
(`fcf8e3e`).

**`CADUCADO` y no `RECHAZADO`**, y la diferencia importa dos veces: el segundo
mentiría sobre quién juzgó, y además dejaría el hallazgo **bloqueado** para la
cola, que es lo contrario de para lo que existe retirar
([ADR-072](DECISIONS/adr-072-caducado-no-miente.md)).

### Mitigar: una salida documentada que nunca funcionó

El 2026-08-28, al ir a usar la llave inglesa del Escaneo para marcar un hallazgo
como ya arreglado, no pasó nada. Ni diálogo, ni cambio, ni aviso.

Pedía la nota con `window.prompt`, que **Electron no implementa**: lanza
`prompt() is not supported.`. Sin `try/catch` y sin ningún error boundary en la
aplicación, la excepción moría muda. Era el único uso de `prompt` del
repositorio, así que ningún otro camino lo delataba — y la base del operador
confirmó que **jamás se había mitigado nada**.

El arreglo (`5fbc872`) lo cambia por un modal. Y al verlo en pantalla apareció un
segundo defecto que ningún gate veía: era el primer modal que nacía dentro de una
`<table>`, y su texto se salía de la caja. `Modal` pasó a montarse por portal
([ADR-075](DECISIONS/adr-075-el-modal-por-portal.md)).

**Es la lección de este acto al revés.** El canal `scan:mitigate` estaba sano y
se probaba **saltándose la interfaz**; el typecheck, las 1748 pruebas unitarias,
los checks de integración y el smoke estuvieron en verde todo el tiempo con el
botón muerto y luego con el diálogo ilegible. El gate verifica que el código
compile, respete sus reglas y que sus canales hagan lo que dicen. No ve un
`onClick` roto ni un texto que desborda. Para eso hay que mirar la pantalla.

### El cierre: las tres atascadas, cada una por su vía

Con las salidas construidas, las tres se resolvieron el 2026-08-28, y ninguna
por el mismo camino.

**La del veto** se retiró con el botón nuevo: quedó CADUCADA con el motivo del
operador y su asiento en el Libro.

**El hallazgo que la motivó** se marcó con la llave recién arreglada, y su nota
dice dónde vive el arreglo —en otro fichero, que es el caso para el que la marca
existe—.

**La huérfana** no se pudo retirar con el botón, porque **ninguna vista la
mostraba**: toda la interfaz del motor lista por proyecto, y su proyecto se había
borrado debajo catorce días antes. Se retiró invocando el canal directamente, que
la acepta porque nunca exigió proyecto ni hallazgo vivos.

Y un detalle que merece quedar escrito: la reconciliación del arranque **la
dejaba viva a propósito**. Su regla dice que un ANALIZADO sin commit espera a que
el operador pulse Generar, y caducarlo sería matar trabajo en curso. La regla es
correcta; lo falso era su supuesto — nadie puede pulsar Generar en una propuesta
que ninguna pantalla enseña.

## Acto 7 — La clase de huérfanas, extinguida en su origen (2026-09-02)

El Acto 6 terminó con las tres atascadas cerradas y una observación incómoda: la
reconciliación del arranque **dejaba viva a propósito** a la huérfana de agosto,
porque su regla dice que un `ANALIZADO` sin commit espera a que el operador pulse
Generar. La regla era correcta; lo falso era su supuesto. Aquello se cerró a mano,
por el canal directo, y a mano solo se cierra un caso.

Este acto no cierra un caso: cierra la clase. Un inventario contra el código
mostró que `752a50b8` no había sobrevivido por una anomalía, sino por **dos
defectos estructurales independientes**, y que cualquiera de los dos bastaba para
producir otra igual. Tres commits, uno por capa.

### El mecanismo: una clave foránea que faltaba por olvido

`db902b0`. De las diez tablas con `project_id`, siete colgaban del proyecto con
`ON DELETE CASCADE` y tres no. Una de las tres, `omega_log`, no la tiene **a
propósito** y su fichero lo argumenta: el asiento sobrevive al proyecto. Las otras
dos, `repair_proposals` y `quality_scans`, no argumentaban nada. Ese silencio era
la prueba: la clave no se decidió omitir, se omitió sin decidir.

El arreglo no cabía en un `ALTER` —SQLite no admite añadir una restricción a una
tabla que ya existe—, así que hubo que recrearlas. Es la segunda migración no
aditiva del proyecto, y al escribirla salió a la luz que
[ADR-036](DECISIONS/adr-036-sqlite-modular-migraciones-aditivas.md) llevaba desde
agosto afirmando que las migraciones nunca cambian tipos, cuando la primera
—`31a6ba0`, del 2026-08-14— ya lo había desmentido sin que nadie lo registrara.
La regla que sí seguía viva, *una base antigua siempre abre*, se conservó;
[ADR-077](DECISIONS/adr-077-cuando-una-migracion-deja-de-ser-aditiva.md) recoge
el procedimiento y, sobre todo, qué le está permitido borrar a una migración: la
constricción limpia su propio dominio, y el Libro no está en su dominio.

Sobre la base del operador la migración se llevó una propuesta huérfana con sus
cuatro eventos y una auditoría de calidad, y dejó intactos los nueve asientos del
proyecto muerto en el Libro de la Vida.

### El juicio: la cascada arreglaba una mitad y abría la otra

`312d6c1`. Con la clave puesta, borrar un proyecto ya se llevaba sus propuestas
—pero **en silencio**. Y ahí apareció el segundo problema, que no era técnico
sino de coherencia: cuando un proyecto se desvanece del disco, la reconciliación
caduca sus propuestas **con razón**; si el operador lo quitaba del tablero, la
cascada se las llevaría **sin ninguna**. El mismo hecho, dos destinos según por
dónde entrara. Es exactamente lo que
[ADR-059](DECISIONS/adr-059-capas-de-estado-no-heredan.md) prohíbe.

De modo que las propuestas vivas pasaron a caducar **antes** de soltar la fila,
con razón propia `PROYECTO_RETIRADO` — distinta de `PROYECTO_AUSENTE`, porque una
la descubre la reconciliación y la otra la provoca un acto deliberado.

Y aquí estaba la trampa que define el arco. `advanceProposal` no escribe en
`omega_log`: escribe el parche de la propuesta y su eslabón en el libro de
eventos, y las dos cosas **cuelgan de la propuesta**, así que la cascada se las
lleva un instante después. Caducar por la vía obvia habría sido teatro — emitir
el juicio y borrarlo acto seguido, con la conciencia tranquila y ni un rastro en
la base. El asiento solo sobrevive porque va a la única tabla sin clave foránea,
y ese `append` lo pone la retirada, no el avance
([ADR-076](DECISIONS/adr-076-el-juicio-antes-de-la-cascada.md)). La prueba se
escribió sobre una base real y no sobre un doble, precisamente porque un doble no
habría notado la diferencia entre el juicio y su representación.

### La red: el guard que estaba detrás del guard equivocado

`488ad16`. Quedaba el segundo agujero, el que el Acto 6 había dejado anotado. La
red existía —`proyecto_ausente` tiene nombre, comentario y razón propia desde
ADR-059—, pero `decideOrphan` preguntaba primero si había commit. Una propuesta
anterior a GENERATE no lo tiene, porque el commit nace ahí; salía por *«ANALIZADO
espera al operador»* y no alcanzaba nunca el chequeo escrito para ella.

El arreglo es el orden: si el proyecto no está, la fase da igual. Con el proyecto
vivo no cambia nada, y eso no es una afirmación de confianza — revertir el orden
tumba exactamente los dos casos nuevos y deja los quince restantes en verde.

### Lo que se ganó, y lo que se apretó

El mismo hecho —este proyecto ya no está— tiene ahora **un solo destino**, entre
por donde entre. La divergencia que ADR-059 prohíbe dejó de ser construible, y la
huérfana invisible dejó de ser un estado que la base admita.

Pero el arco no salió gratis, y conviene que quede escrito junto a lo demás. La
cobertura del recambio obligó a que la suite de migración ejercitara de verdad la
tabla vieja —antes la creaba ya con su forma nueva y la migración se saltaba
sola, de modo que el gate pasaba sin probar nada—, y eso costó líneas:
`scripts/migration-test.cjs` pasó de 71 a **75 de 75**. El arnés de integración
tenía un fichero al filo; ahora tiene dos, y el segundo sin margen ninguno. Se
cerró una clase de defecto y se apretó otro.

## Acto 8 — El ciclo del hallazgo se cierra, y la app aprende de sus roturas (2026-09-11 a 2026-09-13)

Los siete actos anteriores construyeron un motor que repara y un escáner que
encuentra. Este cierra el círculo por los dos extremos que faltaban: **qué le
pasa a un hallazgo cuando deja de ser un problema**, y **qué pasa cuando la app
misma se rompe**.

### Nivel 2 de la auto-mejora: los fallos se observan por su clase (2026-09-11 a 2026-09-12)

El Nivel 1 —los agentes observando sus propios límites— llevaba días produciendo
solo. Lo que no existía era el otro lado: cuando la aplicación reventaba, no
quedaba rastro en ninguna parte. Un inventario lo midió: ciento sesenta y un
`catch` en producción, ciento diez handlers de IPC sueltos, cero wrapper, cero
reportador de errores, cero `uncaughtException`. Veinte de esos `catch` llegaban
a `console.error` — que en un AppImage va a un stdout que no lee nadie.

La decisión que ordena el arco es **qué se guarda**
([ADR-086](DECISIONS/adr-086-los-fallos-se-observan-por-su-clase.md)). En el
Nivel 1 la confidencialidad salió gratis: un `tool_name` es `Bash`, y no puede
contener nada del cliente. Un `message` sí: de los diecisiete que este código
construye interpolando, **ocho concatenan hoy una ruta o una identidad del
proyecto auditado**. Así que la observación se queda con la CLASE del fallo
—dónde reventó, de qué tipo, qué operación— y el texto crudo va al log local,
que no viaja. La señal ya estaba en el código sin que nadie la hubiera nombrado:
ciento cincuenta y seis `err()` son la app funcionando, y siete `throw` son
«esto no debería pasar».

Tres embudos, y ninguno es un `try/catch` repetido. El del proceso principal
escucha `uncaughtException` y `unhandledRejection` — y antes de tocarlos se
**midió** que Electron ya tenía un oyente del primero y ninguno del segundo, así
que escucharlos no le quita nada a nadie. El del IPC **envuelve el registro en la
raíz** en vez de migrar ciento diez llamadas a un helper: eso habría obligado a
editar el fichero de ajustes, que es innegociable, y a confiar en un test que
avisa cuando alguien olvida el helper; envolver cubre los futuros sin que nadie
se acuerde. Y el del renderer queda **construido y desconectado**: su componente
pinta un fallback y `onUncaughtError` arma la observación, pero llevarla al
backlog cruza el puente protegido, así que espera firma — y la desconexión la
garantiza el sistema de tipos, no un comentario.

### El ciclo de vida del hallazgo: confirmar exige juicio (2026-09-12 a 2026-09-13)

Un inventario del tablero encontró veintiséis hallazgos «mitigados, pendientes de
confirmar»: marcas que el operador había escrito a mano tras arreglar cada cosa,
cada una con el sha de su commit. Y encontró que **no había forma de
confirmarlos**. El destino final existía —`EXTINCT`, con su filtro ya puesto en
la consulta del tablero— pero la única vía era el analista del motor. Los
veintiséis estaban castigados y escondidos a la vez: contando para el score y
bloqueando el push, mientras la guarda del motor los dejaba fuera de su cola.

La decisión fue no aflojar nada
([ADR-087](DECISIONS/adr-087-confirmar-un-hallazgo-exige-juicio.md)). La
alternativa barata —un botón que extinguiera por palabra— es el incidente de la
CSP otra vez: dos hallazgos cerrados porque alguien añadió un comentario, con el
`unsafe-inline` que denunciaban todavía en `main`. Un falso positivo molesta; un
falso negativo miente. Así que **el operador pide y el agente otorga**: un botón
en la fila lanza al analista sobre ella, y el desenlace depende de lo que
encuentre en el fichero.

Los tres desenlaces son la pieza que hace el arco honesto. Con el marcador
comprobado el hallazgo muere con juicio. Sin marcador **no muere**, y la razón se
escribe. Y si el analista dice que el problema sigue ahí, el hallazgo **vuelve
solo a la cola del motor**: esa asimetría —la certeza actúa, la duda conserva— se
descubrió usándolo. La primera verificación real dictaminó «sigue vivo» sobre un
hallazgo que el operador había dado por arreglado una semana antes, y dejó ver
que avisar no bastaba: la etiqueta falsa seguía escondiéndolo del motor.

El último eslabón cerró el otro extremo. Integrar un fix no tocaba la fila: el
motor proponía, el operador firmaba, el merge entraba, y el hallazgo seguía
`ACTIVE`. Ahora lo marca `advanceProposal` al llegar a `MERGEADO`, que es el
punto donde convergen las tres vías —la firma, la automática, y el reconciliador
que detecta con git un merge cuya propuesta quedó huérfana—. No extingue: que un
fix entre no prueba que el defecto se fue.

### Lo cerrado tiene su página, y no miente sobre sus muertos

La historia de un proyecto era una consulta que ya existía sin pantalla. Al
construirla apareció el matiz que la salvó de nacer torcida: **las extinciones no
son todas resoluciones**. De las cincuenta y seis de hoy, nueve las cerró un
juicio; veinte son duplicados absorbidos por la reidentificación de ADR-084, y
veintisiete se cerraron en agosto, cuando la ausencia todavía extinguía. Una
cabecera con un total único habría dicho «resuelto» de cuarenta y siete filas que
nadie verificó — la mentira de la CSP repetida en una pantalla nueva. La página
da tres números y distingue las tres clases, y su clasificador cae siempre del
lado que no afirma.

## Acto 9 — El Terminal aprende a juzgarse, y FORTRESS se audita entera (2026-09-17 a 2026-09-19)

### El freno que impedía al producto hacer su trabajo

El 2026-09-17 un turno del lote sobre un proyecto de confianza pidió correr en
autónomo y corrió en supervisado. El hallazgo se llamaba *«falta la cabecera
Content-Security-Policy»*, y el freno del Terminal degradaba por palabra: el
título contenía `security`. **ADR-089** retiró la lista. En una herramienta cuyos
hallazgos son de seguridad por definición, la lista degradaba la mayoría de lo
que encuentra.

Quedó una mitad sin cerrar, y tardó dos días en verse: la misma orden seguía
escrita en el prompt, pidiéndole al modelo que la aplicara a mano. Se retiró el
2026-09-19 (ADR-089, ENMIENDA 1). **Retirar un mecanismo del código no lo retira
del producto si el prompt sigue pidiéndolo.**

### El Terminal se juzga a sí mismo (ADR-090, ADR-091, ADR-093)

El Terminal pasó a tener las capas que el Motor ya tenía: OMEGA juzga el diff
con evidencia, el gate dice lo que corrió en vez de fingir verde, y cada turno
deja **recibo** de las herramientas que usó, redactado en la última puerta antes
de la base. El diff que se juzga incluye ahora los ficheros **creados**, que
antes eran invisibles para `git diff`.

### La Fase B: dos voces enfrentadas (ADR-096, ADR-097)

Nació el **crítico**: un agente cuyo trabajo es buscar el fallo en el fix del
productor, no confirmarlo. OMEGA arbitra entre las dos voces. El debate corrió
por primera vez en vivo el 2026-09-19 — **396 segundos y $1.93**— y no se vio:
el medidor contaba tiempo y dinero, nunca lo que se hacía. **ADR-097** lo hizo
visible y cerró el flujo del autónomo: OMEGA juzga la dirección del plan antes
de tocar código, aprueba el lote desde el proceso principal, y si el productor
da dos veces la misma respuesta el turno para con un texto de persona —
*«Decisión abierta — necesita un humano»*— en vez de dar vueltas a costa del
operador.

### El ensayo en vivo

El 2026-09-19 el autónomo resolvió un lote de tres hallazgos sin una sola
pulsación: **3 de 3 procesados, 2 cerrados a Historia**. El ensayo también
destapó cinco defectos, medidos contra la base y registrados en
[DEUDAS](DEUDAS.md) con su causa raíz y su orden de arreglo.

### La primera auditoría de FORTRESS sobre sí misma

El 2026-09-18, por primera vez, FORTRESS se escaneó entera con paradas y
cobertura declarada. Las cifras salen de la base, no de la pantalla:

| | |
|---|---|
| paradas | **5 / 5** |
| ficheros | **2081 / 2081** |
| duración · coste | **39,1 min · $22,62** (282 turnos) |
| módulos aplicables | **6** (M1, M4, M5, M6, M9, M10) |
| módulos descartados **con evidencia** | **4** (M2, M3, M7, M8) |
| hallazgos | **23** — 6 HIGH, 7 MEDIUM, 10 LOW |

**El logro es la cobertura total con descarte justificado, no el número de
hallazgos.** El escáner no dijo «no aplica» y siguió: nombró el fichero que
buscó y no estaba (M2, M7) o citó el código que probaba lo contrario (M3
apoyado en `README.md:104-113`; M8, en `billing-mode.ts`).

**Los 6 HIGH están todos en `templates/`**, el kit universal que FORTRESS
distribuye a los proyectos que audita — no su maquinaria. En `src/` salieron
**2 MEDIUM** (`build-env.ts:38`, `project-mcp.ts`) y **8 LOW**, casi todos de
accesibilidad. Que el código propio saliera casi limpio tras nueve meses es
fortaleza medida, no falta de profundidad.

> **Una lección de método, y costó estar a punto de escribir una cifra falsa
> aquí.** La pantalla del tablero acumula hallazgos vivos de TODOS los escaneos;
> la fila del escaneo dice cuántos vio ESE. Leer la pantalla y atribuirle el
> número a un escaneo concreto mezcla semanas de trabajo en una sola fecha. La
> base es la verdad; la pantalla es una vista. Y el propio escaneo dejó una
> deuda al descubierto: su contador dice 27 donde hay 23 filas.

---

## Presente

El motor repara, el operador firma, el motor vuelve a mirar y cierra lo que ya
está arreglado diciendo por qué. La vuelta entera funciona sobre el propio
repositorio, y el registro de lo que hizo dice lo que pasó. La identidad de los
hallazgos de este repositorio está reconciliada; la de otros proyectos espera a
que se los vuelva a escanear.

**El ciclo de vida de un hallazgo está completo**, y las dos mitades que lo
cerraban se probaron en vivo sobre el repositorio propio: una verificación
dictaminó «sigue vivo» y devolvió su hallazgo a la cola, y otra probó la
ausencia y lo mandó a la historia. Lo que falta para que el tablero se vacíe sin
trabajo manual es **verificar en masa**: hoy se confirma de uno en uno, y los
veintiséis mitigados heredados son declaraciones sin comprobar — la única que se
comprobó resultó falsa.

**La app observa sus propias roturas** desde el 2026-09-12, aunque todavía no
haya tenido ninguna que contar. El embudo del renderer sigue construido y
desconectado: conectarlo cruza el puente protegido y espera una firma.

Ninguna propuesta queda atascada: las tres que lo estaban se cerraron el
2026-08-28, cada una por su vía. Las que siguen vivas esperan firma, que es un
estado legítimo y no un bloqueo. Y ninguna puede quedar huérfana: una propuesta
sin proyecto ya no es un estado que la base admita.

Lo que sigue nombrado y sin cerrar, de antes de estos dos actos: la **detección
de lo que rompe el árbol después de integrarlo** —la otra mitad de la sexta
condición, que ya cobró su primera pieza—; los **veintiséis hallazgos** que
murieron antes de que las extinciones exigieran motivo y siguen sin decir por
qué; y **cómo se rectifica un asiento** en un registro que no se edita, la
pregunta que dejaron los once que dicen «denegada» sobre integraciones que están
en `main`.

De los cuatro **defectos conocidos** que el Acto 6 destapó, el Acto 7 cerró los
dos primeros —la cascada y el orden de la reconciliación—. Siguen sin arreglo
aplicado:

- **El arnés de integración está en el filo, y ahora por partida doble**:
  `integration-test.cjs` en 74 de las 75 líneas que su propia regla permite, y
  `migration-test.cjs` en 75 de 75, sin margen ninguno — lo apretó el Acto 7 al
  hacer que la suite ejercitara de verdad el recambio de tabla. La próxima suite
  de comprobaciones no cabe en ninguno de los dos.
- **Ningún modal se cierra con Escape.** El componente compartido no escucha el
  teclado, y los doce que cuelgan de él heredan la carencia.

De los tres huecos que el Acto 7 destapó documentando, el del parte se cerró el
mismo día: `turnos_agotados` —y otros catorce motivos— caían en un `else` que
los anunciaba a todos como «por gate o correa», cierto para tres. El reparto
pasó a una tabla exhaustiva agrupada por la acción que le toca al operador, y
un rechazo nuevo sin casilla ya no compila. Cerró tres deudas del registro y las
doce hermanas que compartían cajón. Siguen abiertos los otros dos:

- **El catálogo de rechazos está a medias.** La tabla de
  [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) explica catorce de las **veintidós**
  razones que el dominio declara; faltan `generator_timeout`, `provider_error`,
  `cli_no_arranco`, `turnos_agotados`, `analisis_ilegible`,
  `gate_sin_verificacion`, `omega_error` y `proyecto_sin_confianza`. Son ocho, no
  siete: la cuenta de veintiuna con la que se escribió esto era de vista, y al
  contarla contra el vocabulario salieron veintidós. La familia hermana —las
  siete de la reconciliación— sí quedó completa, y desde el cierre del parte cada
  una tiene además su casilla documentada.
- **Dos piezas sin documento propio.** La reconciliación del arranque, que el
  Acto 7 modificó, solo está escrita en ADR-059 y en el código; y el
  `FORTRESS-RECORD.md` que se deja en la carpeta del proyecto al retirarlo —al
  que ese acto añadió las propuestas vivas— no aparece en ningún documento.

Y una deuda que llevaba meses sin veredicto **se manifestó sola**: el gate del
merge del parte cayó con un «claude — No instalado» que no era del cambio, sino
del CLI recién reinstalado —216 MB— tardando más que los ocho segundos que el
probe de la app concede, con la caché fría. Caliente tarda una centésima. Estaba
anotada como sin auditar desde agosto; ahora tiene evidencia y fecha, y es el
argumento de que las veintiocho que siguen sin mirar no son ruido.

Lo que viene por delante está en [ROADMAP](ROADMAP.md): afianzar lo construido,
convertir el auditor en un entorno de desarrollo asistido completo, y preparar el
proyecto para publicarse. Sin fechas de compromiso, como todo aquí.

## Referencias

- [DECISIONS/](DECISIONS/README.md) — los registros de decisión
  arquitectónica (ADR-001 a ADR-087) que sostienen esta historia.
- [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md), [FLOWS/RETRY](FLOWS/RETRY.md),
  [FLOWS/LOOP-VIEJO](FLOWS/LOOP-VIEJO.md),
  [FLOWS/CAPABILITIES](FLOWS/CAPABILITIES.md),
  [FLOWS/GENESIS](FLOWS/GENESIS.md) — los flujos operativos citados aquí.
- [AGENTS](AGENTS.md) — las dos familias de agentes: los del motor y los de
  auditoría.
- [PRINCIPLES](PRINCIPLES.md) — los principios de método que emergieron del
  desarrollo y de la documentación.
- [CHANGELOG](CHANGELOG.md) — el registro cronológico de cambios por hito.
- [ROADMAP](ROADMAP.md) — las direcciones próximas del proyecto.
