# Flujo: reindexado automático del grafo

Los agentes de FORTRESS consultan un grafo del código (Knowledge Graph) para
ubicar símbolos, dependencias y contexto sin leer archivos enteros — misma
respuesta, dos órdenes de magnitud menos tokens. Ese grafo se mantiene
alineado con el HEAD del repositorio de forma automática. Este documento
describe cuándo, cómo y por qué.

## Por qué existe

Si el grafo está desalineado con HEAD, un agente puede razonar sobre código
viejo. En el motor de auto-reparación el daño está acotado por diseño: el
analista usa el grafo como pista pero verifica el veredicto contra el código
VIVO (ver [SELF-REPAIR](SELF-REPAIR.md)), así que la desalineación solo
produce ineficiencia — más tokens — no errores. Otros consumidores del grafo
pueden ser menos robustos. Mantener el grafo alineado protege la calidad de
todos a la vez.

## Cuándo se dispara

Tres disparadores automáticos y uno manual. No hay polling continuo: el
sistema evalúa puntualmente.

1. **On-boot:** al arrancar FORTRESS se evalúan TODOS los proyectos
   configurados; la cola de uno los serializa, y el arranque no espera a
   nadie (todo en background).
2. **On-focus:** al seleccionar un proyecto activamente en la interfaz.
3. **Post-merge:** cuando el HEAD del proyecto cambia (por un merge o
   cualquier commit), la siguiente evaluación natural — boot o focus — lo
   detecta y realinea. No hay hook de git: la detección es por comparación
   de SHA.
4. **Manual:** el operador puede forzar un reindex desde la interfaz.

## Las precondiciones: por qué NO hay nada que reconciliar

Antes de mirar SHAs y estados hay **tres preguntas** que pueden cerrar el asunto
sin llegar a la matriz. Viven en un módulo propio (`loQueHayQueReconciliar`) que
`reconcileGraph` consulta primero, y las tres devuelven `SKIPPED` con su línea de
registro:

| Precondición | Por qué |
|---|---|
| El proyecto ya no existe | no hay nada que indexar |
| El proyecto está **CONTAMINADO** | el circuit breaker de la Capa 4 lo bloquea |
| No hay repositorio git | el reindex necesita un HEAD que leer |

**El freno de contaminación es el añadido reciente, y cubre las tres puertas de
golpe.** El arranque, el chip del grafo y el foco de proyecto convergen todos en
`reconcileGraph`, así que una sola comprobación en el embudo cierra lo que en el
handler habría cubierto solo dos de las tres — y la que se habría quedado fuera
es la del arranque, la más silenciosa. Ver
[ADR-073](../DECISIONS/adr-073-el-freno-en-el-embudo.md).

Se mira **antes** que el HEAD a propósito: leerlo lanza git, y un proyecto
bloqueado no merece ni el proceso. Y no condena a nadie: la marca se relee en
cada llamada, así que en cuanto el operador desbloquea el proyecto
(`projects:unblock`) la siguiente evaluación entra sin más.

## Matriz de decisión

La decisión es una función PURA del dominio: mismo input, misma decisión.
Se evalúa en este orden (el orden importa), y **solo si las precondiciones de
arriba dejaron pasar**:

| Estado observado | Decisión |
|---|---|
| Corrida RUNNING con menos de 15 minutos | SALTAR — ya se está haciendo |
| Corrida RUNNING con más de 15 minutos | RECLAMAR — se asume proceso muerto y se re-dispara |
| Nunca indexado (sin SHA registrado) | REINDEXAR |
| SHA indexado == HEAD actual, estado IDLE | SALTAR — grafo alineado |
| SHA indexado == HEAD actual, estado ERROR | SALTAR — HEAD sin cambios desde el último intento fallido |
| SHA indexado != HEAD actual | REINDEXAR |

Dos matices del orden y las ramas, aprendidos construyéndola:

- **El gate de RUNNING va primero a propósito:** sin él, un proyecto
  nunca-indexado con una corrida fresca en curso re-dispararía el reindex en
  cada focus.
- **Un intento fallido no se reintenta en bucle:** si el reindex falló y el
  HEAD no se ha movido, repetir daría lo mismo; se espera a que el HEAD
  cambie (o a un disparo manual).

El umbral de corrida huérfana es **15 minutos** (900.000 ms).

## Cómo se ejecuta

- El binario del grafo corre como proceso local en modo CLI, con el
  directorio del proyecto como cwd. **Cero agentes, cero tokens de modelo:**
  el indexado es análisis estático local.
- **El HEAD se lee ANTES de lanzar el proceso:** lo que se persiste al
  terminar es el SHA que el índice realmente vio, no uno que aparezca
  durante la corrida.
- Timeout: **10 minutos**; si se excede, el proceso se mata y el estado
  queda en ERROR.
- Cola FIFO de UNO a nivel de proceso: N proyectos al arrancar no desatan N
  indexados paralelos; se encolan. Un fallo de un trabajo no bloquea a los
  siguientes. La cola es de memoria, no persistida
  ([PRINCIPLES](../PRINCIPLES.md), principio 11).
- Si el binario del grafo no está instalado, el reindex falla limpio con
  estado ERROR (y la interfaz muestra el comando de instalación).
- Del volcado de salida de un fallo se persiste solo la ÚLTIMA línea con
  contenido — el error accionable, no el log entero.
- Coste típico: segundos a pocos minutos, según el tamaño del repositorio.

## Estados observables

El chip del grafo en el panel del proyecto muestra exactamente cuatro
estados:

- **grafo sin indexar** — nunca se ha corrido para este proyecto.
- **grafo alineándose** — reindex en curso (indicador girando).
- **grafo alineado** — SHA indexado == HEAD actual.
- **grafo desactualizado** — el HEAD se movió y el reindex aún no corrió, o
  el último intento falló.

Cada cambio de estado se empuja al renderer en el momento (push por IPC, no
polling de la interfaz).

## Persistencia

El estado del índice por proyecto (SHA indexado, timestamp, estado
IDLE/RUNNING/ERROR, inicio de la corrida y último error) se guarda en la
base local. Al arrancar FORTRESS el estado se recupera: un RUNNING
persistido con más de 15 minutos se considera huérfano de una sesión
anterior y se reclama — nada queda "corriendo" para siempre.

## Errores comunes

- **Binario no encontrado:** el grafo no está instalado o no está en el
  PATH; estado ERROR con mensaje claro y pista de instalación en la
  interfaz.
- **Repo sin git:** sin `.git` no hay HEAD; el proyecto se salta en
  silencio (no es un error: hay proyectos sin repo).
- **Timeout:** repos muy grandes pueden exceder los 10 minutos; el estado
  queda ERROR y el detalle persiste.
- **Instancias simultáneas:** si dos instancias de FORTRESS reindexaran el
  mismo proyecto a la vez, la caché del binario del grafo podría recibir
  escrituras concurrentes; en la práctica FORTRESS es una instancia por
  sesión.

## Referencias

- [SELF-REPAIR](SELF-REPAIR.md) — cómo el motor usa el grafo (pista barata,
  veredicto contra el código vivo).
- [ARCHITECTURE](../ARCHITECTURE.md) — la capa de infraestructura donde
  viven el runner y la cola.
- [GLOSSARY](../GLOSSARY.md) — términos: MCP, decideReindex, worktree.
- [PRINCIPLES](../PRINCIPLES.md) — principio 11 (la cola es de proceso, no
  persistida).
- `docs/DATA-MODEL.md` — columnas de proyectos relacionadas con el índice.
