# Terminal (inicio)

La vista de arranque de FORTRESS: lo que el operador ve al abrir la
aplicación. Combina la visión de cartera (todos los proyectos con su score)
y la ejecución sobre el proyecto activo (la ventana de chat que actúa). Es
el hogar del uso diario.

**Nombre interno del view:** `chat` (store de UI). **Componentes
principales:** vista multi-proyecto + ventana de chat. **Nota de mapeo:**
cruce de nombres conocido — `view='chat'` es esta vista "Terminal
(inicio)"; la vista con etiqueta "Chat" es otra (`view='construir'`, ver
[Chat (planificación)](chat-planificacion.md)). Etiqueta visible y nombre
interno están invertidos por evolución histórica del proyecto.

## Ubicación en la navegación

Es la vista por defecto: se muestra sin seleccionar nada en el sidebar (el
resto de vistas tienen su botón; esta es el estado base al que se vuelve).

## Estructura principal

Dos zonas apiladas:

- **Zona multi-proyecto (dashboard):** la cartera de proyectos registrados,
  cada uno como una tarjeta con su nombre, score y desglose. Es el hub para
  saltar entre proyectos y ver el estado general.
- **Ventana de chat (Terminal):** contextual al proyecto activo — el hilo
  de conversación donde el agente ejecuta de verdad dentro del proyecto,
  con el input abajo.

## Elementos interactivos

- **Tarjeta de proyecto:** selecciona el proyecto activo; muestra el score
  y su desglose por dimensiones al expandir.
- **Medidor de score / desglose:** abre el detalle de las 6 dimensiones de
  calidad (ver [Escaneo](escaneo.md)).
- **Diálogo de proyecto:** desde aquí se abre el alta de proyecto (elegir,
  conectar o crear) — ver [Nuevo proyecto](nuevo-proyecto.md).
- **Input del chat:** escribe la intención; envía al motor de chat.
- **Atajos:** cinco botones sobre el input que envían una petición
  predefinida — revisar seguridad, limpiar código, buscar bugs, escribir
  tests y comprobar si está listo para producción. El texto de cada uno es lo
  que activa el router por palabras clave (ver [AGENTS](../AGENTS.md), "Cómo
  se despachan"). No se muestran mientras el proyecto está en la entrevista
  de configuración.
- **Botón de envío:** dispara el turno; deshabilitado si el proyecto está
  pendiente de configuración.
- **Toggle de modo (supervisado / autónomo):** el modo autónomo exige
  proyecto confiable, que no sea el propio repo de FORTRESS y que haya red de
  reversión (git). **Ya no degrada por el contenido** de la petición: ese freno
  por palabras se retiró con ADR-089.
- **Medidor de la corrida:** progreso y coste del turno en vivo.

## Estados de la vista

- **Sin proyectos:** la cartera vacía invita a dar de alta el primero.
- **Con proyectos, ninguno activo:** las tarjetas visibles; el chat pide
  seleccionar uno.
- **Proyecto pendiente de configuración:** el chat redirige a la
  entrevista de configuración (ver [Chat (planificación)](chat-planificacion.md)).
- **Chat en curso:** los chunks llegan por streaming; el medidor avanza.
- **Sin motor disponible:** mensaje que indica instalar el CLI o
  configurar la API key.

## Flujos que dispara

- Envío de mensaje y streaming → [FLOWS/CHAT](../FLOWS/CHAT.md).
- Un turno de auditoría integral desde el chat puede fijar la calidad
  general del proyecto → [FLOWS/SCAN](../FLOWS/SCAN.md).

## Datos que muestra

- Tarjetas de proyecto y su score → tabla de proyectos ([DATA-MODEL](../DATA-MODEL.md)).
- Hilo de conversación → tabla de mensajes de chat.

## Canales IPC usados

- `projects:list`, `projects:add`, `projects:remove`, `projects:self` — la
  cartera.
- `chat:send`, `chat:chunk`, `chat:progress`, `chat:stop`,
  `chat:history` — la ventana de chat.
- `loop:status`, `loop:chunk` — el medidor del loop cuando está activo.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Escaneo](escaneo.md) — el score que muestran las tarjetas.
- [Chat (planificación)](chat-planificacion.md) — la otra superficie de
  chat, y la entrevista de configuración.
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el flujo completo del chat.
