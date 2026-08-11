# Arquitectura — FORTRESS Command Center (FCC)

Aplicacion de escritorio (Electron + electron-vite) organizada con Domain-Driven
Design en cuatro capas concentricas. Este documento describe las capas, la regla
de dependencias, los limites de tamano de codigo y el tema visual OMEGA.

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

### 2. application (casos de uso)

- Orquesta el dominio: cada caso de uso es una operacion de negocio completa
  (crear proyecto, ejecutar auditoria, consultar historico, etc.).
- Depende unicamente de `domain`. Recibe las implementaciones concretas por
  inyeccion de dependencias contra los puertos definidos en el dominio.
- No conoce SQLite, ni la API de Anthropic, ni Electron.

### 3. infrastructure (adaptadores)

- Implementaciones concretas de los puertos del dominio:
  - **SQLite** (`better-sqlite3`): persistencia y migraciones.
  - **Anthropic** (`@anthropic-ai/sdk`): cliente de agentes de IA.
  - **Electron** (proceso main): IPC, ventanas, ciclo de vida, sistema de
    archivos.
- Depende de `application` y `domain`; nunca al reves.

### 4. presentation (UI)

- Renderer: **React 19 + zustand** (estado global), Tailwind para estilos.
- Se comunica con el proceso main **exclusivamente a traves del preload
  tipado**: una API expuesta por `contextBridge` con tipos compartidos, sin
  acceso directo a Node ni a Electron desde el renderer.
- Consume casos de uso via IPC; no contiene logica de negocio.

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

## Tema OMEGA

Identidad visual unica de la aplicacion:

- **Paleta**: dorado sobre fondo negro-navy (acentos dorados, superficies
  oscuras azul-noche). Sin colores fuera de esa gama salvo estados semanticos
  puntuales.
- **Cero emojis**: ni en la UI, ni en textos de la aplicacion, ni en logs.
  La iconografia se resuelve con `lucide-react`.
- Tipografia: Syne (display) y DM Sans (texto), servidas localmente via
  `@fontsource`.
