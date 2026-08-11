# Documentación

Un visor de la documentación del proyecto activo: lee los archivos Markdown
de su raíz —incluido el marco de gobierno interno gitignored— sin salir de
FORTRESS ni abrir la carpeta a mano. Es la ventana para consultar la
doctrina de un proyecto desde dentro de la aplicación.

**Nombre interno del view:** `docs`. **Componente principal:** el visor de
documentación. **Etiqueta en el sidebar:** "Documentación".

## Ubicación en la navegación

Botón "Documentación" en el cuerpo del sidebar.

## Estructura principal

- **Lista de documentos:** los `.md` disponibles en la raíz del proyecto,
  a un lado.
- **Panel de lectura:** el contenido del documento seleccionado, renderizado
  como Markdown.

## Elementos interactivos

- **Selección de documento:** elige cuál se muestra en el panel de lectura.
  Al abrir la vista, se selecciona el primero disponible.

## Estados de la vista

- **Sin proyecto:** estado vacío.
- **Proyecto sin documentos:** estado vacío que lo indica.
- **Con documentos:** la lista poblada; el primero (o el elegido) se
  renderiza.

## Flujos que dispara

- Es una vista de solo lectura: no dispara flujos que modifiquen el
  sistema. Los documentos que muestra los produce, entre otros, la
  entrevista de configuración de [Chat (planificación)](chat-planificacion.md).

## Datos que muestra

- El contenido de los `.md` de la raíz del PROYECTO (en su filesystem),
  no de la base de datos. Incluye el marco de gobierno interno del
  proyecto, que es gitignored en ese proyecto pero legible desde aquí.

## Canales IPC usados

- `docs:list` — la lista de documentos del proyecto.
- `docs:read` — el contenido de un documento (con allowlist de nombres).

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [Chat (planificación)](chat-planificacion.md) — la entrevista que redacta
  los documentos de gobierno.
- [ARCHITECTURE](../ARCHITECTURE.md) — la sección de documentación
  consumida por el runtime (por qué ciertos documentos viven donde viven).
