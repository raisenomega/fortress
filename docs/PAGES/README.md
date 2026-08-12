# Vistas de FORTRESS

Cada archivo describe una vista (o superficie transversal) de la interfaz.
La documentación usa la ETIQUETA VISIBLE (lo que el operador ve en el
sidebar) con un mapeo interno al nombre del store y el componente principal.

## Vistas del proyecto (día a día)

- [Terminal (inicio)](terminal.md) — dashboard multi-proyecto + ventana de
  chat.
- [Escaneo](escaneo.md) — corridas de escaneo con los 11 agentes de
  auditoría.
- [Chat (planificación)](chat-planificacion.md) — vista de conversación en
  modo planificar.
- [Documentación](documentacion.md) — lector de docs del proyecto.

## Vistas del motor y auditoría

- [Sentinel Omega](sentinel-omega.md) — meta-auditor del sistema.
- [Actividad](actividad.md) — timeline transversal de eventos.
- [Superficie externa](superficie-externa.md) — auditoría de postura
  (efímera).
- [Rendimiento](rendimiento.md) — métricas y cuotas del sistema.

## Vistas del sistema evolutivo

- [Auto-mejora FORTRESS](auto-mejora.md) — backlog + capacidades + motor de
  auto-reparación.
- [Génesis de agentes](genesis-agentes.md) — HUD del bucle de génesis.
- [Cognition](cognition.md) — lector del COGNITION-LOG del proyecto.

## Vistas transversales

- [Ajustes](ajustes.md) — configuración global.
- [Conectores](conectores.md) — conectores instalados.
- [Onboarding](onboarding.md) — superficie de alta al arranque.
- [Nuevo proyecto](nuevo-proyecto.md) — diálogo con 3 modos
  (chooser/connect/create).

## Cruce de nombres conocido: Terminal ↔ Chat

El código usa `view='chat'` para lo que el operador ve como "Terminal
(inicio)" (dashboard multi-proyecto + ventana de chat por defecto). Y usa
`view='construir'` para lo que el operador ve como "Chat (planificación)"
(la vista de construir).

Los nombres están invertidos respecto a lo intuitivo. Este documento
(`docs/PAGES/`) usa las etiquetas visibles (Terminal, Chat) por precisión
con la experiencia del operador. Cada archivo anota su nombre interno de
view para trazabilidad al código.

Al buscar en el código:

- La vista Terminal vive bajo `view='chat'` (nombre histórico).
- La vista Chat/planificación vive bajo `view='construir'` (nombre
  histórico).

## Superficies sin view en el store

Onboarding y Nuevo proyecto NO tienen entrada en el `ui-store` principal:

- Onboarding es la superficie de alta que se muestra al arranque cuando
  falta la API key.
- Nuevo proyecto es un diálogo modal disparado desde la vista
  multi-proyecto o desde Ajustes (controlado por el estado `projectDialog`).

Sus archivos documentan esto explícitamente.
