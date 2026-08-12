# Nuevo proyecto

El diálogo para incorporar un proyecto a FORTRESS, con tres modos: elegir el
origen, conectar un proyecto existente, o crear uno nuevo desde cero. Es un
diálogo modal, no una vista a pantalla completa.

**Mapeo interno:** NO es una entrada de `MainView` — es un diálogo modal
controlado por el estado `projectDialog` del `ui-store` (`chooser`,
`connect`, `create` o cerrado). **Componente principal:** los diálogos de
proyecto.

## Ubicación en la navegación

Se dispara desde la vista multi-proyecto (Terminal de inicio) al añadir un
proyecto. No tiene botón propio en el sidebar; es un modal contextual.

## Estructura principal — tres modos

El diálogo avanza por estados según lo que el operador elija:

### Modo 1 — Elegir origen (`chooser`)

La pantalla inicial: dos caminos, conectar un proyecto existente o crear uno
nuevo. Es el punto de bifurcación.

### Modo 2 — Conectar (`connect`)

Apunta a una carpeta local existente y la registra como proyecto, tras
verificar que sea válida (ruta absoluta, sin traversal).

### Modo 3 — Crear (`create`)

Crea un proyecto nuevo desde cero: elige la carpeta destino, la prepara
(carpeta + git) y la deja lista para la configuración guiada. El proyecto
recién creado nace pendiente de configuración.

## Elementos interactivos

- **Selector de origen:** elige entre conectar o crear.
- **Selector de destino / carpeta:** apunta a la ruta (existente para
  conectar, nueva para crear); valida ruta absoluta y sin traversal.
- **Vista previa del destino:** muestra dónde quedará el proyecto antes de
  confirmar.
- **Acciones del paso:** avanzar, retroceder o cerrar el diálogo.

## Estados de la vista

- **Cerrado:** el diálogo no se muestra.
- **Eligiendo:** la pantalla de origen.
- **Conectando:** el formulario de proyecto existente.
- **Creando:** los pasos de carpeta destino para uno nuevo.

## Flujos que dispara

- Un proyecto recién creado entra pendiente de configuración y el chat lo
  redirige a la entrevista de configuración guiada →
  [Chat (planificación)](chat-planificacion.md) y
  [FLOWS/CHAT](../FLOWS/CHAT.md).

## Datos que muestra

- El proyecto que se registrará → tabla de proyectos ([DATA-MODEL](../DATA-MODEL.md)).
- Para crear desde cero, la app escribe el marco de gobierno inicial en el
  filesystem del proyecto nuevo (los documentos que redacta la entrevista).

## Canales IPC usados

- `projects:add`, `projects:pick-folder` — conectar un proyecto existente.
- `new-project:home-dirs`, `new-project:plan-folder`,
  `new-project:create-folder`, `new-project:register` — crear desde cero.
- `config:execute` — escribir el marco de gobierno inicial.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Terminal (inicio)](terminal.md) — desde donde se abre este diálogo.
- [Chat (planificación)](chat-planificacion.md) — la entrevista de
  configuración del proyecto nuevo.
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el bloqueo hasta configurado.
