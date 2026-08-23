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

- Validación de ruta absoluta y normalizada en el dominio, aplicada al
  registrar proyectos y en las operaciones que escriben en disco.
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
- Push a origin: siempre humano. El motor jamás toca el remoto.
- Correa de alcance: el fix solo puede tocar los archivos permitidos;
  salirse rechaza la propuesta.
- Los hallazgos **no mueren solos**: el escaneo no extingue por ausencia, así
  que un problema de seguridad no puede desaparecer del tablero porque el
  escáner no lo nombrara una vez. Ver
  [ADR-065](DECISIONS/adr-065-nada-muere-sin-juicio.md).
- Presupuesto de tokens por propuesta con techo duro.

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
  (defensa por capas), 6 (datos vs metadatos) y 16 (contenido de agente como
  input no confiable).
- `docs/GLOSSARY.md` — términos usados aquí.
