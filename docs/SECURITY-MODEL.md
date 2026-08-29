# FORTRESS — Modelo de seguridad

FORTRESS opera con el código del usuario y con credenciales de la API de
Anthropic: los dos activos más sensibles que un desarrollador puede confiar a
una herramienta. Este documento describe qué protege, contra qué actores y
con qué clases de mecanismos. Es público por diseño: la seguridad por
transparencia es más robusta que la seguridad por obscuridad. Lo que este
documento NO contiene, deliberadamente, son ubicaciones concretas de guards
ni historial de vulnerabilidades específicas — describe clases de amenaza y
clases de mitigación.

## Alcance

Cubre: la aplicación de escritorio, sus agentes, el motor de auto-reparación,
la auditoría de superficie externa y la cadena de suministro directa. No
cubre: el sistema operativo del usuario, el hardware, ni los servicios de
terceros aguas arriba (ver "Lo que NO cubre este modelo").

## Activos protegidos

- **API key del usuario** (credencial de la API de Anthropic).
- **Código y archivos de los proyectos del usuario** (aislamiento estricto
  por proyecto).
- **Base de datos local** con historial de trabajo, hallazgos y ajustes.
- **Integridad del propio binario de FORTRESS** (la herramienta no se opera
  a sí misma en caliente).

## Actores considerados

- **Proyecto malicioso auditado:** un repo hostil que intenta explotar al
  auditor que lo lee.
- **Renderer comprometido:** XSS o dependencia comprometida que gana
  ejecución en la interfaz.
- **Prompt injection:** texto del proyecto auditado que intenta inyectarse
  como instrucción en los agentes.
- **Supply chain:** paquetes npm comprometidos, servidores MCP de terceros.
- **Superficie externa:** las URLs que la auditoría de postura visita.

## Mitigaciones (por clase de amenaza)

### API key

- Cifrada con Electron `safeStorage` (el mecanismo estándar del sistema
  operativo).
- Solo el proceso principal la descifra; el renderer únicamente puede
  preguntar si existe.
- Nunca en variables del renderer, logs, ni error stacks; los textos que
  podrían contenerla pasan por redacción de secretos.

### Aislamiento del renderer

- `contextIsolation: true` y `nodeIntegration: false` (patrón Electron
  oficial): el renderer nunca toca Node.
- Preload estricto con API tipada; la superficie del bridge es explícita y
  finita.
- CSP declarada; no se relaja sin justificación escrita.

### Path traversal

- Validación de ruta absoluta en el dominio al registrar proyectos: se exige
  raíz absoluta (POSIX, unidad de Windows o UNC). Es una comprobación de
  prefijo; la cadena registrada **no** se normaliza, porque esa cadena es la
  identidad del proyecto y transformarla en silencio movería el modelo de
  datos, no solo la validación.
- El rechazo de segmentos `..` cubre el alta de proyecto nuevo —la carpeta
  padre bajo la que se crea el árbol—, no todas las puertas de registro. Es
  cobertura declarada de un flujo, no una garantía de dominio (ver "Lo que NO
  cubre este modelo").
- Las lecturas y escrituras dentro de un proyecto sí resuelven la ruta contra
  la raíz y rechazan lo que se salga, symlinks incluidos: ahí la defensa vive
  en infraestructura, que es donde puede resolverlos.
- Los nombres de archivo que propone un agente pasan por allowlist antes de
  escribirse (ver `docs/PRINCIPLES.md`, principio 16).

### SSRF (Server-Side Request Forgery)

- Rechazo de loopback, rangos privados, link-local y las formas
  equivalentes del mismo host (IPv4-mapped, hexadecimal, decimal) — todas
  las formas del input, no solo el literal (principio 1).
- Aplicado a los fetches externos de la auditoría de postura.

### Prompt injection

- Sanitización de los campos de METADATOS de un hallazgo (título,
  descripciones, razones) antes de entrar a un prompt.
- El código y el diff NO se sanitizan: son el objeto de la revisión
  (principio 6). Van entre delimitadores estrictos.
- El contenido de archivos del proyecto se trata como texto, nunca se
  ejecuta ni se interpreta como comando.

### Loop autónomo sobre el propio repo

- Guard en dominio puro que impide que los ciclos autónomos operen sobre el
  código del propio FORTRESS.
- Aplicado por múltiples capas independientes, cada una probada por
  separado (principio 3).
- Verificado en el binario distribuido, no solo en el código fuente.

### Auto-reparación disciplinada

- Todo cambio se genera en un worktree aislado, fuera del árbol vivo del
  proyecto.
- Gate hermético (instalación limpia + typecheck + lint + tests unitarios)
  dentro del worktree antes de cualquier firma.
- Revisor semántico independiente con veredicto de 6 ejes; el motor
  recomputa la conclusión (veredicto sintético).
- Firma humana antes del merge local, **salvo** el cerco de integración
  automática que el proyecto declare en su `.fortress/config`. En este
  repositorio el cerco está encendido y es estrecho a propósito: solo `LOW`,
  un archivo, hasta diez líneas de diff, y una lista negra que excluye
  migraciones, secretos, workflows, IPC, preload y el empaquetado. Todo lo
  demás espera firma. Ver [ADR-060](DECISIONS/adr-060-auto-merge-loop.md).
- El cerco mide además el **resultado**: si el fix dejara algún archivo por
  encima del límite de líneas del proyecto, no se integra solo. El gate corre
  dentro del worktree de la propuesta y nadie mide el árbol ya integrado, así
  que sin esta condición un fix de una línea sobre un archivo en el filo dejaría
  `main` sin pasar su propio lint, sin que ningún humano lo hubiera mirado.
  Frenar aquí no rechaza el fix: lo manda a la firma. Ver
  [ADR-069](DECISIONS/adr-069-cerco-mide-el-fichero-antes-de-integrar.md).
- Push a origin: siempre humano. El motor jamás toca el remoto.
- Correa de alcance: el fix solo puede tocar los archivos permitidos;
  salirse rechaza la propuesta.
- Los hallazgos **no mueren solos**: el escaneo no extingue por ausencia, así
  que un problema de seguridad no puede desaparecer del tablero porque el
  escáner no lo nombrara una vez. Ver
  [ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md).
- Presupuesto de tokens por propuesta con techo duro.
- **Hay archivos que el motor no puede integrar sin que un humano los mire**,
  esté el cerco donde esté. Un sistema no aplica por su cuenta un cambio a las
  reglas que gobiernan lo que puede aplicar por su cuenta
  ([principio 21](PRINCIPLES.md)); proponerlo sí, porque son código y pueden
  tener defectos. La lista **no es configurable**: un
  proyecto añade entradas a su lista negra, nunca quita estas — si la protección
  fuese declarativa, bastaría una propuesta que la borrase para abrir todo lo
  demás. El criterio para entrar es uno: **si cambiar ese archivo debilita una
  defensa, entra**, y da igual a cuál de las tres familias pertenezca —gobernar
  la autonomía, validar lo que entra, o implementar una defensa de seguridad—.
  Cubre así el modo efectivo y las guardas de ejecución, las rutas y URLs que
  llegan del renderer o de la red, el filtro anti-SSRF entero por carpeta, la
  redacción de secretos antes de que se persistan (`redactSecrets`), y el
  armado del entorno y las herramientas de **todo** agente (`buildEnv` y
  `buildArgs`) — heredar el entorno del operador o abrir la lista de tools son
  la misma clase de agujero que la lista existe para no reabrir sola.

### Auditoría de calidad: cuatro capas y un circuit breaker

La auditoría integral de 6 dimensiones corre **probes sobre el árbol vivo** del
proyecto, no sobre una copia. Que un probe sea de solo lectura es una promesa que
hay que poder verificar, así que se verifica en cuatro capas:

| Capa | Qué hace |
|---|---|
| **1 — snapshot** | foto «antes»: hashea **y copia** cada archivo (sin `node_modules`/`.git`) |
| **2 — restauración** | deja el árbol EXACTO como el snapshot: borra lo nuevo, repone lo modificado o borrado |
| **3 — verificación** | comprueba que quedó byte-idéntico; lo que no cuadre sale como violación forense con sus dos hashes |
| **4 — circuit breaker** | si la Capa 3 encuentra diferencias, el proyecto queda **CONTAMINADO** |

**Qué hace la Capa 4 cuando salta.** No persiste el score —auditar un árbol que
la propia auditoría alteró no mide nada— y marca el proyecto con el detalle
forense de lo que cambió: qué archivo, y su hash antes y después.

**Qué bloquea la marca.** `guardRun` y `guardMerge` la consultan antes que nada,
así que ningún agente corre y ninguna firma integra sobre ese proyecto. Y desde
el cerrojo del reindexado, tampoco se realinea su grafo: las tres puertas del
reindex —arranque, chip y foco— pasan por la misma precondición. Ver
[ADR-073](DECISIONS/adr-073-el-freno-en-el-embudo.md) y
[FLOWS/GRAPH-REINDEX](FLOWS/GRAPH-REINDEX.md).

**Cómo se sale.** El mensaje del bloqueo dice *«revisa el detalle forense y
desbloquéalo a mano»*, y durante un tiempo esa frase fue falsa: no existía forma
de quitar la marca, así que un proyecto contaminado quedaba bloqueado para
siempre. El desbloqueo (`projects:unblock`) cierra el ciclo — enseña el forense
al operador, y solo si confirma limpia las dos columnas y asienta la decisión en
el Libro de la Vida con su motivo, como acto humano y no como verificación
([ADR-074](DECISIONS/adr-074-el-asiento-no-afirma-mas-de-lo-que-sabe.md)).

El ciclo entero, y ninguna de las tres piezas sirve sin las otras dos:

```
contaminar (Capa 4)  ->  frenar (acciones + reindex)  ->  desbloquear (humano)
```

Frenar sin salida condenaría el proyecto; una salida sin freno no protegería
nada. El breaker no decide que el árbol esté limpio cuando se levanta: registra
que un humano miró el forense y cargó con la decisión.

### Supply chain

- Dependencias y servidores MCP con versión fijada; nada de ejecutar "lo
  último publicado" en cada spawn.
- Sin dependencias nuevas sin justificación.
- Servidores MCP explícitos por configuración, no automáticos.

### Superficie externa (postura)

- Solo lectura, con confirmación de propiedad del dominio auditado.
- Validación de host antes de cada fetch (ver SSRF).

## Trazabilidad

- El libro de vida asienta cada acción del motor con actor, coste en tokens,
  duración y evidencia estructurada (append-only).
- El COGNITION-LOG registra patrones de amenaza con estado (activo /
  mitigado / extinto).
- La extinción de un patrón exige evidencia, no fe: ausente del escaneo Y
  con el archivo modificado.

## Agujeros cerrados por el propio motor (2026-08-23)

Tres hallazgos del escáner sobre FORTRESS misma, reparados por el motor de
auto-reparación y **firmados por el operador** antes de integrarse:

| defecto | dónde | fix |
|---|---|---|
| `graph:verify` lanzaba el CLI con la API key sin pasar por `guardRun`, evadiendo el tope diario y el carril de concurrencia | `ipc/graph-action-handlers.ts` · `handleVerify` | `guardRun` + `endRun` en `finally`, como sus hermanos, y un `logger` para que el freno no sea mudo |
| Comandos bloqueados se persistían sin pasar por `redactSecrets` | `claude-code/stream-events.ts` | redacción antes de persistir |
| `configState` del renderer se insertaba sin validar (validado al leer, no al escribir) | `persistence/sqlite-project-repository.ts` | validación simétrica |

Costó seis intentos llegar al primero: tres murieron por el contador de
presupuesto mal medido ([ADR-068](DECISIONS/adr-068-tope-mide-trabajo-y-techo-de-turnos.md)),
uno por techo de turnos y uno lo vetó el revisor.

En el mismo arco se cerraron por vía manual el entorno heredado del verify del
loop (`buildGateEnv`) y el alcance de `cancelRun`, que mataba los procesos de
todos los proyectos.

## Lo que NO cubre este modelo

- La forma de la raíz que el operador registra a mano: se exige que sea
  absoluta, pero un `..` intermedio solo se rechaza en el alta de proyecto
  nuevo, y ningún symlink de esa raíz se resuelve antes de guardarla. Queda
  asentado como límite conocido, no como garantía.
- Compromiso del sistema operativo del usuario.
- Ataque físico al equipo.
- Ingeniería social contra el operador.
- Compromiso de la API de Anthropic aguas arriba.

## Reporte de vulnerabilidades

Por definir: aún no existe un canal formal de divulgación responsable. Esta
sección se completará cuando el proyecto lo establezca.

## Referencias

- `docs/ARCHITECTURE.md` — arquitectura completa y documentación consumida
  por el runtime.
- `docs/PRINCIPLES.md` — principios 1 (todas las formas del input), 3
  (defensa por capas), 6 (datos vs metadatos), 16 (contenido de agente como
  input no confiable) y 21 (un sistema no cambia solo las reglas que lo
  gobiernan).
- `docs/GLOSSARY.md` — términos usados aquí.
