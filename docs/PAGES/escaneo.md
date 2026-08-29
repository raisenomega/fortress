# Escaneo

La vista donde el operador escanea un proyecto en busca de hallazgos de
seguridad, revisa el expediente vivo y decide qué hacer con cada hallazgo.
Es la superficie del flujo de escaneo.

**Nombre interno del view:** `scan`. **Componente principal:** la vista de
escaneo. **Etiqueta en el sidebar:** "Escaneo".

## Ubicación en la navegación

Botón "Escaneo" en el cuerpo del sidebar, junto a las secciones de trabajo
del proyecto.

## Estructura principal

- **Cabecera:** el proyecto activo, su score y el estado del último
  escaneo.
- **Tira de conteos:** el número de hallazgos por severidad
  (CRITICAL/HIGH/MEDIUM/LOW), con los CRITICAL destacados por bloquear el
  push.
- **Acciones:** los botones de escaneo, calidad y push.
- **Tabla de hallazgos:** una fila por hallazgo con severidad, título,
  archivo y línea, y sus acciones de descarte.

## Elementos interactivos

- **Botón de escaneo:** dispara el escaneo de seguridad (despacha los
  agentes activos). Muestra progreso en vivo.
- **Botón de calidad:** dispara la auditoría integral de 6 dimensiones.
- **Botón de push:** intenta empujar; queda BLOQUEADO si hay CRITICAL
  abiertos, con su razón visible.
- **Marcar como ya arreglado (la llave inglesa):** el operador declara que el
  defecto era real y ya está resuelto. Pide una **nota obligatoria** en un
  diálogo —qué lo arregla: normalmente el sha del commit—, y con ella el
  hallazgo sale de la cola del motor **pero sigue visible y sigue contando**:
  que esté arreglado lo confirma un escaneo, no esta marca. El ↺ de al lado
  deshace la declaración y lo devuelve a la cola.
- **Descartar / reabrir un hallazgo:** decisión del operador (marca el
  hallazgo como descartado o lo reabre) — el descarte sobrevive a
  re-escaneos.
- **Preguntar al chat sobre un hallazgo:** lleva el hallazgo al chat para
  analizarlo o repararlo.

> **Marcar y descartar no son lo mismo, y el tablero lo dice distinto.**
> Descartar (el ojo tachado) significa **«esto no era un problema»**: el hallazgo
> se tacha, se etiqueta como falso positivo y deja de contar para la nota.
> Marcar (la llave) significa **«lo era, y ya lo arreglé»**: no se tacha, sigue
> contando, y lleva su nota debajo. Mezclarlos haría que descartar pareciera
> arreglar.
>
> La nota importa más de lo que parece: es la **única pista de dónde vive el
> arreglo** cuando no está en el fichero del hallazgo — el caso normal de una
> guarda que se movió a otro módulo. Por eso la marca sobrevive a los
> re-escaneos: el escáner seguirá leyendo ese fichero y seguirá encontrando el
> defecto ahí, y si cada escaneo borrase la marca, marcarla no serviría de nada.
> Solo cae si **ese fichero cambia** después de marcarlo, porque entonces la
> declaración ya no cubre lo que hay ahora.

## Estados de la vista

- **Sin escanear:** el score dice "sin escanear todavía"; no hay hallazgos.
- **Escaneando:** indicador de progreso; los agentes corren en el
  proyecto.
- **Con hallazgos:** la tabla poblada, ordenada por urgencia (abiertos
  primero, luego por severidad).
- **Push bloqueado:** el botón de push muestra el motivo del bloqueo por
  CRITICAL.
- **Sin hallazgos vivos:** expediente limpio (o todo extinto/descartado).

## Flujos que dispara

- Escaneo de seguridad y expediente → [FLOWS/SCAN](../FLOWS/SCAN.md).
- Un hallazgo elegible puede pasar al motor de auto-reparación →
  [FLOWS/SELF-REPAIR](../FLOWS/SELF-REPAIR.md).

## Datos que muestra

- Hallazgos con su identidad estable y ciclo de vida → tabla de findings.
- Historial de escaneos y de calidad → tablas de scans y quality_scans.
- Descartes que sobreviven → tabla de dismissals.

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `scan:run`, `scan:findings`, `scan:counts`, `scan:history`,
  `scan:progress` — el escaneo y su expediente.
- `scan:dismiss`, `scan:reopen` — descartar un falso positivo y deshacerlo.
- `scan:mitigate`, `scan:unmitigate` — declararlo ya arreglado, con su nota, y deshacerlo.
- `quality:run` — la auditoría integral.
- `push:run` — el empuje con su bloqueo por CRITICAL.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [FLOWS/SCAN](../FLOWS/SCAN.md) — el flujo completo, las dos claves de
  identidad y la extinción honesta.
- [AGENTS](../AGENTS.md) — los agentes de auditoría que el escaneo
  despacha.
- [Sentinel Omega](sentinel-omega.md) — la meta-auditoría y el veto.
