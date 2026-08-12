# Génesis de agentes

La vista del bucle de génesis: entrena capacidades por su cuenta y para en
los topes. Un agente se entrena solo, pero su activación sigue exigiendo la
firma del operador (desde la tarjeta de la capacidad), y OMEGA veta siempre.
Es la superficie de la frontera más autónoma del sistema.

**Nombre interno del view:** `genesis`. **Componente principal:** la vista
de génesis. **Etiqueta en el sidebar:** "Genesis de agentes".

## Ubicación en la navegación

Botón "Genesis de agentes" en el cuerpo del sidebar.

## Estructura principal

- **Cabecera:** el propósito explícito — el bucle entrena solo, la
  activación exige firma, OMEGA veta siempre.
- **Aviso de configuración:** si los topes no están fijados, un aviso de
  que el bucle no puede encenderse.
- **HUD del bucle:** el estado en vivo (corriendo o parado), episodios
  hechos, gasto contra el tope, y el motivo de parada si aplica.
- **Toggle de encendido:** activa o detiene el bucle.
- **Capacidades:** las mismas tarjetas de la vista de auto-mejora, para ver
  cómo progresan mientras el bucle corre.

## Elementos interactivos

- **Toggle encender/apagar:** arranca o detiene el bucle. Solo enciende si
  ambos topes (coste y episodios) están fijados y son mayores que cero.
- **Tarjeta de capacidad:** desde aquí se firma la activación de un agente
  entrenado (la génesis lo entrena, no lo activa).

## Estados de la vista

- **Sin topes configurados:** aviso; el toggle no puede encender.
- **Parado:** el bucle no corre; muestra el último motivo de parada si lo
  hubo.
- **Corriendo:** el HUD avanza — episodios hechos, gasto acumulado,
  reparto justo entre capacidades.
- **Parada por éxito (`sin-trabajo`):** todas las capacidades alcanzaron la
  fase oficial o no queda ninguna propuesta por ejercitar (no es un fallo).

## Flujos que dispara

- El bucle completo, sus topes, los motivos de parada y la doctrina
  "respeta el gate por kind" → [FLOWS/GENESIS](../FLOWS/GENESIS.md).
- El ciclo de vida de las capacidades que ejercita →
  [FLOWS/CAPABILITIES](../FLOWS/CAPABILITIES.md).

## Datos que muestra

- Estado del bucle: en vivo por push, no persistido como historial.
- Capacidades y su progreso → tablas de capabilities. Los episodios NO se
  marcan como auto vs manual (la evidencia se pesa igual).

Detalle en [DATA-MODEL](../DATA-MODEL.md).

## Canales IPC usados

- `system:genesis-toggle` — encender/apagar.
- `system:genesis-status` (push) — el HUD en vivo.
- `system:capabilities`, `system:activate-agent` — las tarjetas y la firma.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [FLOWS/GENESIS](../FLOWS/GENESIS.md) — el bucle, los topes y "reversible
  vs irreversible externo".
- [Auto-mejora FORTRESS](auto-mejora.md) — el ciclo de capacidades y la
  firma de activación.
- [Sentinel Omega](sentinel-omega.md) — el veto que siempre aplica.
