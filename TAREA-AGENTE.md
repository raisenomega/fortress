# TAREA-AGENTE.md — D3: sección "Conectores" (MCP)

Trabajas dentro de `fortress-command-center` (tu directorio actual). Construye la
funcionalidad completa descrita aquí. No es una charla: crea los archivos, cablea
las capas y verifica de verdad. Ve por fases y verifica entre cada una.

## Reglas del proyecto (obligatorias)

- **DDD estricto:** `domain/` puro (sin Electron/React/SQLite) → `application/`
  → `infrastructure/` y `presentation/`. Dependencias hacia adentro.
- **Máximo 75 líneas por archivo.** Si algo crece, pártelo en módulos.
- **Copia los patrones que ya existen.** No inventes estilos nuevos:
  - Sección de sidebar: mira `SidebarViewLinks.tsx`, `MainArea.tsx` y el tipo
    `MainView` en `stores/ui-store.ts`.
  - Vista + store + service: mira `PostureView.tsx`, `posture-store.ts`,
    `posture-service.ts`.
  - IPC + preload: mira `posture-handlers.ts`, `register-handlers.ts`,
    `channels.ts`, `preload/system-api.ts`, `preload/project-apis.ts`.
  - Tabla nueva en SQLite (aditiva, no rompe bases existentes): mira
    `schema-telemetry.ts` y cómo `database.ts` la aplica; repositorio como
    `sqlite-agent-run-repository.ts`; cableado en `app-context.ts` y el puerto
    en `application/context.ts`.
- **No toques** auth, la API key, `safeStorage`, ni los handlers IPC existentes
  salvo para registrar el nuevo. No borres nada.

## Qué construir

Una sección "Conectores" en el sidebar, bajo la navegación, que gestione
servidores MCP que luego se pasan a Claude Code.

### Fase 1 — Dominio
- `domain/connectors/connector.ts`: tipo `Connector` { id, name, url,
  description, category, builtin }. Catálogo de predefinidos: Figma
  (`https://mcp.figma.com/mcp`), Canva (`https://mcp.canva.com/mcp`), GitHub,
  Supabase, Linear, Slack, Notion, Sentry. Para GitHub/Supabase deja la url
  vacía y márcalos como "vía CLI" en la descripción.
- `domain/connectors/connector-url.ts`: valida una URL de MCP custom. Solo
  `https://` (un MCP inseguro es una fuga). Devuelve Result.
- Tests de ambos.

### Fase 2 — Persistencia
- Tabla `connectors` (id TEXT PK, name, url, category, enabled INTEGER, builtin
  INTEGER, created_at). Aditiva, en el estilo de `schema-telemetry.ts`.
- Repositorio: `list()`, `setEnabled(id, on)`, `addCustom(...)`, `remove(id)`.
  Los predefinidos no se borran; solo se activan/desactivan.
- Cablea el puerto en `application/context.ts` y `app-context.ts`.

### Fase 3 — IPC + preload
- `connectors:list`, `connectors:set-enabled`, `connectors:add`, `connectors:remove`.
- Handler, registro, canales, tipos en `system-api.ts`, impl en `project-apis.ts`.

### Fase 4 — Presentación
- Entrada "Conectores" en el sidebar (bajo Configuración).
- `ConnectorsView`: lista con toggle on/off, punto de estado (verde
  conectado / gris sin configurar), y formulario para añadir un MCP custom
  (nombre + URL + descripción). Reusa `Toggle`, `LabeledField`, `Notice`.
- Store + service, en el patrón de posture.

### Fase 5 — Pasar los MCP activos a Claude Code
- En `claude-cli.ts`, cuando haya conectores activos con URL, añade el flag
  `--mcp-config` con su configuración. CUIDADO: es la ruta que ejecuta a todos
  los agentes. No rompas `buildArgs`; añade, no reescribas. Si dudas, deja este
  paso a medias y dilo — vale más un buildArgs intacto que uno roto.

## Verificación (obligatoria, la puedes correr tú)

Entre fases: `npm run typecheck`. Al final, los tres:

```
npm run typecheck && npm run lint && npm run test:unit
```

Todo en verde, 0 errores de lint, ningún archivo > 75 líneas. Si algo falla,
corrígelo. No des una fase por hecha sin verla verde.

## Límites

- No commitees (no tienes permiso) ni hagas `git push`.
- No instales paquetes ni ejecutes MCPs de verdad: solo construyes el panel y
  la persistencia. Conectar en vivo es en tiempo de ejecución, no ahora.
- Si el tope de gasto te detiene, para y reporta dónde te quedaste.

## Al terminar

Reporta: qué fases completaste, qué archivos creaste/tocaste, el resultado de
las tres verificaciones, y cualquier cosa que dejaste a medias y por qué.
