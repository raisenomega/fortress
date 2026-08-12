# Conectores

La vista que gestiona los conectores del operador: integraciones externas
que FORTRESS puede usar (por ejemplo, servidores MCP). Son del operador, no
de un proyecto — borrar un proyecto no apaga un conector.

**Nombre interno del view:** `conectores`. **Componente principal:** la
vista de conectores. **Etiqueta:** "Conectores" (se abre desde la
navegación de la aplicación).

## Ubicación en la navegación

Accesible desde la navegación de la aplicación (no es una sección de trabajo
de un proyecto concreto).

## Estructura principal

- **Lista de conectores:** cada uno con su nombre, categoría, descripción y
  su estado (activado o no).
- **Formulario de alta:** para añadir un conector nuevo con sus campos.

## Elementos interactivos

- **Toggle de activación:** enciende o apaga un conector.
- **Añadir conector:** formulario con nombre, URL, descripción y categoría.
- **Eliminar conector:** quita uno; los conectores de fábrica (builtin) no
  se borran.

## Estados de la vista

- **Sin conectores propios:** solo los de fábrica, si los hay.
- **Con conectores:** la lista poblada, cada uno con su estado.

## Flujos que dispara

Los conectores son configuración del operador; no disparan un flujo
documentado por sí mismos. Un conector activo (como el grafo de código)
alimenta a los agentes cuando corren.

## Datos que muestra

- Los conectores → tabla `connectors` (sin FK a proyecto: son del
  operador).

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `connectors:list`, `connectors:set-enabled`, `connectors:add`,
  `connectors:remove` — la gestión completa.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [DATA-MODEL](../DATA-MODEL.md) — la tabla de conectores.
- [FLOWS/GRAPH-REINDEX](../FLOWS/GRAPH-REINDEX.md) — el conector del grafo
  de código en acción.
