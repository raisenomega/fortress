# Chat (planificación)

Un chat minimalista y enfocado para planificar y construir sobre un
proyecto: proponer un plan, investigar y ejecutar cambios con red de
seguridad. También es donde ocurre la entrevista de configuración de un
proyecto nuevo. Es una superficie distinta de la Terminal de inicio.

**Nombre interno del view:** `construir`. **Componente principal:** la
vista de construir. **Etiqueta en el sidebar:** "Chat". **Nota de mapeo:**
cruce de nombres conocido — la etiqueta "Chat" corresponde a
`view='construir'`, mientras que la vista Terminal corresponde a
`view='chat'`. Etiqueta visible y nombre interno están invertidos.

## Ubicación en la navegación

Botón "Chat" en el pie del sidebar, junto a Ajustes — separado de la
Terminal de inicio a propósito (planificar vs ejecutar).

## Estructura principal

- **Hilo central angosto:** los mensajes, centrados, con el input abajo.
- **Input con dos controles:** a la izquierda adjuntar un archivo; a la
  derecha elegir el modo de la petición.
- **Entrevista de configuración:** si el proyecto está pendiente de
  configuración, la vista se convierte en la entrevista guiada en lugar del
  chat normal.

## Elementos interactivos

- **Input de mensaje** y **botón de envío.**
- **Adjuntar archivo:** selecciona un archivo del proyecto como contexto.
- **Menú de modo (Plan / Investigación / Ejecutor):** el modo Ejecutor
  exige un Plan previo y construye con red git + verify. Nunca opera sobre
  el propio repo de FORTRESS (bloqueado en el proceso principal).
- **Botón de detener:** aborta la corrida en curso (mata el grupo de
  procesos).

## Estados de la vista

- **Sin proyecto:** aviso de seleccionar uno.
- **Proyecto no confiable:** aviso de que trabajar aquí exige confianza;
  invita a activarla.
- **Pendiente de configuración:** la vista muestra la entrevista de
  configuración guiada (el agente propone los documentos de gobierno uno a
  uno; la app captura los borradores y, al aprobar, los escribe).
- **Chat activo:** el hilo del proyecto, con el modo elegido.

## Flujos que dispara

- Los turnos de chat y su streaming → [FLOWS/CHAT](../FLOWS/CHAT.md).
- La entrevista de configuración escribe los documentos de gobierno del
  proyecto (el envelope de documentos vive aquí, no en la Terminal).

## Datos que muestra

- El hilo de conversación → tabla de mensajes de chat.
- Los documentos de gobierno propuestos durante la entrevista, que la app
  escribe al filesystem del proyecto (no a la base).

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `chat:send`, `chat:chunk`, `chat:progress`, `chat:stop` — el chat.
- `build:plan`, `build:investigate`, `build:feature`, `build:stop`,
  `build:pick-file` — los modos de construcción.
- `config:execute`, `docs:list`, `docs:read` — la entrevista de
  configuración y la escritura de documentos.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Terminal (inicio)](terminal.md) — la otra superficie de chat (ejecución
  general).
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el flujo, los modos y el bloqueo hasta
  configurado.
- [Documentación](documentacion.md) — visor de los documentos que la
  entrevista produce.
