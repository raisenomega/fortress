# Arquitectura — FORTRESS Command Center (FCC)

Aplicacion de escritorio (Electron + electron-vite) organizada con Domain-Driven
Design en cuatro capas concentricas. Este documento describe las capas (con
ejemplos reales del codigo), la regla de dependencias, las reglas duras
verificadas por maquina, la base de datos, el IPC, la distribucion, el testing
y la documentacion que el runtime consume.

**Filosofia:** DDD estricto con dependencias hacia adentro. El dominio no
conoce Electron, React, SQLite ni ningun adaptador; los detalles se conectan
por puertos (interfaces) definidos en el nucleo.

## Las 4 capas

```
+---------------------------------------------------------------+
|  presentation   React + zustand (renderer, via preload)       |
|  +---------------------------------------------------------+  |
|  |  infrastructure   SQLite / Anthropic / Electron          |  |
|  |  +---------------------------------------------------+  |  |
|  |  |  application   casos de uso                        |  |  |
|  |  |  +---------------------------------------------+   |  |  |
|  |  |  |  domain   entidades y reglas de negocio     |   |  |  |
|  |  |  +---------------------------------------------+   |  |  |
|  |  +---------------------------------------------------+  |  |
|  +---------------------------------------------------------+  |
+---------------------------------------------------------------+
```

### 1. domain (nucleo)

- Entidades, value objects y reglas de negocio puras.
- **Cero dependencias**: no importa nada de otras capas, de Node, de Electron
  ni de librerias externas. Solo TypeScript puro.
- Define los contratos (interfaces de repositorios y puertos) que las capas
  externas implementan.
- Ejemplos reales: `domain/repair/proposal.ts` (maquina de estados del motor
  de auto-reparacion, `canTransition` como unico juez),
  `domain/repair/select-target.ts` (seleccion C1 determinista) y
  `domain/shared/icon-name.ts` (nombres semanticos de icono: el dominio
  nombra la idea, no el componente).

### 2. application (casos de uso)

- Orquesta el dominio: cada caso de uso es una operacion de negocio completa
  (crear proyecto, ejecutar auditoria, consultar historico, etc.).
- Depende unicamente de `domain`. Recibe las implementaciones concretas por
  inyeccion de dependencias contra los puertos definidos en el dominio.
- No conoce SQLite, ni la API de Anthropic, ni Electron.
- Ejemplos reales: `application/repair/plan-repair.ts` (C1 elegir -> C2
  entender), `application/repair/run-gate.ts` (gate hermetico en worktree),
  `application/repair/book-cursor.ts` (telemetria del libro de vida que jamas
  bloquea al motor).

### 3. infrastructure (adaptadores)

- Implementaciones concretas de los puertos del dominio:
  - **SQLite** (`better-sqlite3`): persistencia y migraciones.
  - **Anthropic** (`@anthropic-ai/sdk`): cliente de agentes de IA.
  - **Electron** (proceso main): IPC, ventanas, ciclo de vida, sistema de
    archivos.
- Depende de `application` y `domain`; nunca al reves.
- Ejemplos reales: `infrastructure/persistence/` (repositorios SQLite
  parametrizados, nunca concatenan input), `infrastructure/repair/graph-analyst.ts`
  (agente C2 grafo-primero) e `infrastructure/ipc/register-handlers.ts`
  (punto unico de registro IPC).

### 4. presentation (UI)

- Renderer: **React 19 + zustand** (estado global), Tailwind para estilos.
- Se comunica con el proceso main **exclusivamente a traves del preload
  tipado**: una API expuesta por `contextBridge` con tipos compartidos, sin
  acceso directo a Node ni a Electron desde el renderer.
- Consume casos de uso via IPC; no contiene logica de negocio.
- Ejemplos reales: `presentation/components/system/RepairProposalRow.tsx`
  (fila del expediente del motor), `presentation/stores/` (zustand),
  `presentation/components/common/Icon.tsx` (unico punto de dibujo de
  iconos lucide, resueltos por nombre semantico del dominio).

## Regla de dependencias (hacia adentro)

Las dependencias apuntan siempre hacia el centro:

```
presentation -> infrastructure -> application -> domain
```

- Una capa solo puede importar de capas mas internas, nunca de capas mas
  externas ni de capas hermanas por fuera de sus contratos.
- `domain` no importa nada; `application` solo importa `domain`.
- Los detalles (base de datos, SDK, framework) se conectan mediante interfaces
  definidas en el nucleo (inversion de dependencias). Cambiar SQLite o el
  proveedor de IA no debe tocar `domain` ni `application`.

## Limites de tamano

Limites estrictos que fuerzan modulos pequenos y de responsabilidad unica:

| Unidad  | Maximo    |
| ------- | --------- |
| Archivo | 75 lineas |
| Funcion | 50 lineas |

Si un archivo o funcion supera el limite, se divide: extraer helpers, separar
en modulos por responsabilidad o promover logica a su capa correcta. Los
limites aplican a todo el codigo fuente del proyecto.

Reglas duras adicionales, todas verificadas por ESLint (`eslint .`, sin cache):

- Sin `any` en TypeScript (`no-explicit-any`).
- Un componente por archivo; el nombre del archivo es el del componente.
- Iconos SOLO via el registro semantico (`Icon` + `icon-name.ts`): ningun
  componente importa lucide directamente fuera del registro.
- `max-lines` (75) y `max-lines-per-function` (50) en la configuracion:
  el limite lo vigila la maquina, no la disciplina.

## Tema OMEGA

Identidad visual unica de la aplicacion:

- **Paleta**: dorado sobre fondo negro-navy (acentos dorados, superficies
  oscuras azul-noche). Sin colores fuera de esa gama salvo estados semanticos
  puntuales.
- **Cero emojis**: ni en la UI, ni en textos de la aplicacion, ni en logs.
  La iconografia se resuelve con `lucide-react`.
- Tipografia: Syne (display) y DM Sans (texto), servidas localmente via
  `@fontsource`.
- Nunca colores hardcodeados: siempre tokens (`bg-primary`, `text-critical`,
  `border-border`); primary dorado sobre negro-navy.

## Base de datos

- Tecnologia: SQLite via `better-sqlite3` (modulo nativo, fuera del asar).
- Ubicacion (Linux): `~/.config/fortress-command-center/fortress.db`.
- Migraciones aditivas: `hasColumn` + `ALTER TABLE`, sin ORM. Las columnas
  nuevas llevan default para que el esquema viejo siga siendo valido.
- Todas las consultas parametrizadas; nunca se concatena input.
- Detalle completo del esquema: `docs/DATA-MODEL.md` (por completar, Fase 2).

## Comunicacion entre procesos (IPC)

- `contextIsolation: true`, `nodeIntegration: false`: el renderer nunca toca
  Node.
- Preload estricto con API tipada via `contextBridge`; los tipos se comparten
  con el renderer.
- Canales agrupados por dominio funcional (`repair:*`, `graph:*`, `scan:*`,
  `chat:*`, ...), registrados en un punto unico
  (`infrastructure/ipc/register-handlers.ts`).
- Las llamadas a la API de Claude salen del proceso main; la API key (cifrada
  con `safeStorage`) jamas cruza el bridge.
- Detalle completo de canales: `docs/IPC.md` (por completar, Fase 2).

## Distribucion

- AppImage (Linux, principal): `npm run build:linux` — la salida queda FUERA
  del repo (`../dist/`). NSIS (Windows) y DMG (mac) disponibles.
- El binario instalado NUNCA se reemplaza con la app corriendo; el rebuild es
  un paso humano, deliberado y en frio.
- La documentacion interna, `templates/` y los artefactos de verificacion se
  excluyen del asar por patron en `electron-builder.yml`.
- Proceso completo de release: `docs/RELEASE.md` (por completar, Fase 5).

## Testing

- **Unit** (`npm run test:unit`): vitest sobre dominio puro y persistencia
  contra SQLite en memoria; sin Electron.
- **Integracion** (`npm test`): levanta Electron con `userData` temporal y
  ejercita el stack real renderer -> preload -> IPC -> caso de uso -> SQLite;
  aborta si la app reasigna el userData (proteccion de la base real).
- **Smoke** (`npm run smoke`): monta la UI real y falla si no pinta.
- **Preview** (`npm run preview`): siembra datos y captura las pantallas.
- **Escaneo real** (`npm run verify:scan`): lanza Claude Code de verdad contra
  un proyecto vulnerable; fuera de `npm test` porque tarda minutos.

## Verificacion

Gate minimo antes de cada commit: `typecheck` + `lint` + `test:unit`; el gate
completo agrega `npm test`. Proceso de contribucion: `docs/CONTRIBUTING.md`
(por completar, Fase 5).

## Documentacion consumida por el runtime

Tres documentos viven donde viven porque el CODIGO los consume ahi:

- `CLAUDE.md` (raiz): doctrina del proyecto que Claude Code lee al arrancar
  cada sesion; `infrastructure/system/project-inspector.ts` verifica su
  existencia (`hasClaude`) para el prompt del chat. No confundir con
  `templates/CLAUDE.md` (plantilla universal que FORTRESS distribuye).
- `COGNITION-LOG.md` (raiz): el cerebro por proyecto;
  `infrastructure/cognition/read-cognition-log.ts` y `write-cognition-log.ts`
  lo leen y reescriben con path fijo `join(projectPath, 'COGNITION-LOG.md')`.
- `ARCHITECTURE.md`: `infrastructure/probe/operation-probe.ts` acepta DOS
  ubicaciones (`ARCHITECTURE.md` en raiz o `docs/ARCHITECTURE.md`) porque el
  scaffolder de FORTRESS escribe el suyo en la raiz de los proyectos nuevos
  que genera; restringir a `docs/` penalizaria a esos proyectos con un
  hallazgo espurio. Este documento vive en `docs/` (patron nuevo del propio
  FCC); ambas ubicaciones siguen siendo validas para proyectos auditados.

## Documentos relacionados

- Vision y estado: `docs/OVERVIEW.md`
- Glosario: `docs/GLOSSARY.md` (por completar)
- Modelo de seguridad: `docs/SECURITY-MODEL.md` (por completar)
- Principios de metodo: `docs/PRINCIPLES.md` (por completar)
