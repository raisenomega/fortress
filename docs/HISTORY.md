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
fechas. El corte de esta versión es el 2026-08-11; las etapas posteriores se
añadirán por edición cuando cierren.

El proyecto entero, hasta este corte, cabe en once días intensos: del
2026-08-01 al 2026-08-11.

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

## Presente

El plan documental está completo y los agentes conocen la documentación que
explica el sistema en el que trabajan. Las deudas que la integración destapó
quedaron saldadas.

El motor repara, el operador firma y nada desaparece del tablero sin que alguien
lo haya visto. Queda la Fase B de la identidad: reconciliar las filas anteriores
al cambio y revivir los tres hallazgos que murieron mal.

Lo que viene por delante está en [ROADMAP](ROADMAP.md): afianzar lo construido,
convertir el auditor en un entorno de desarrollo asistido completo, y preparar el
proyecto para publicarse. Sin fechas de compromiso, como todo aquí.

## Referencias

- [DECISIONS/](DECISIONS/README.md) — los registros de decisión
  arquitectónica (ADR-001 a ADR-068) que sostienen esta historia.
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
