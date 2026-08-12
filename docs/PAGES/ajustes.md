# Ajustes

La pantalla de configuración de FORTRESS: cuenta, API key, presupuestos
(general, del loop, de génesis) y modo de operación. Todo se guarda en el
equipo; FORTRESS no envía nada a ningún servidor propio.

**Nombre interno del view:** `settings`. **Componente principal:** la vista
de configuración. **Etiqueta en el sidebar:** "Configuración" (en el pie,
junto a Chat).

## Ubicación en la navegación

Botón de configuración en el pie del sidebar.

## Estructura principal

Seis secciones apiladas (las que expone el código, ni una de adorno):

- **Cuenta:** el estado de la cuenta de Anthropic y su login.
- **API key:** guardar, verificar o limpiar la key.
- **Presupuesto general:** el tope de gasto del sistema.
- **Presupuesto del loop:** los topes del loop autónomo (coste y ciclos),
  sin default — ambos obligatorios para encenderlo.
- **Presupuesto de génesis:** los topes del bucle de génesis (coste y
  episodios), sin default — ambos obligatorios para encenderlo.
- **Modo de operación:** supervisado o autónomo (por defecto supervisado).

**Nota honesta:** no hay toggle de telemetría — la telemetría externa es
cero por diseño, no una opción; ni toggle de tema — la identidad visual es
única (tema OMEGA). Solo se documenta lo que existe.

## Elementos interactivos

- **Formulario de API key:** pegar la key; se valida contra la API y se
  cifra con el keychain del sistema.
- **Botón de limpiar key:** borra la key guardada.
- **Campos de presupuesto:** el tope general, y los pares (coste, ciclos) y
  (coste, episodios) para loop y génesis.
- **Selector de modo:** cambia entre supervisado y autónomo.

## Estados de la vista

- **Sin key:** la sección de API key invita a configurarla; el resto de la
  app opera limitada hasta tenerla.
- **Con key válida:** las secciones muestran su estado actual.
- **Presupuestos sin fijar:** loop y génesis no pueden encenderse hasta que
  sus topes sean mayores que cero.

## Flujos que dispara

- La configuración de topes habilita el loop y la génesis →
  [FLOWS/LOOP-VIEJO](../FLOWS/LOOP-VIEJO.md) y
  [FLOWS/GENESIS](../FLOWS/GENESIS.md).
- El modo de operación afecta cada turno de chat →
  [FLOWS/CHAT](../FLOWS/CHAT.md).

## Datos que muestra

- Ajustes y topes → tabla `settings` (con lista blanca de claves).
- La API key NO está en la base: cifrada con el keychain del sistema
  operativo ([SECURITY-MODEL](../SECURITY-MODEL.md)).

## Canales IPC usados

- `settings:get`, `settings:set` — los ajustes (lista blanca de claves).
- `settings:save-api-key`, `settings:has-api-key`, `settings:check-api-key`,
  `settings:clear-api-key` — la key.
- `account:status`, `account:login` — la cuenta.

Detalle de contratos: [IPC](../IPC.md).

## Referencias

- [SECURITY-MODEL](../SECURITY-MODEL.md) — el manejo cifrado de la API key.
- [FLOWS/CHAT](../FLOWS/CHAT.md) — el modo de operación en acción.
- [Onboarding](onboarding.md) — la primera captura de la key.
