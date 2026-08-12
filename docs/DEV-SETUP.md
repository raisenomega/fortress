# Puesta a punto del entorno de desarrollo

Esta guía describe cómo bajar FORTRESS Command Center y arrancarlo en local para
desarrollar. Está dirigida a quien va a trabajar en el código; para las
disciplinas de contribución, ver [CONTRIBUTING](CONTRIBUTING.md).

## Requisitos previos

FORTRESS es una aplicación Electron con React y TypeScript, y usa un módulo
nativo de base de datos (better-sqlite3) que se compila durante la instalación.
Hacen falta:

- **Node.js**, una versión LTS reciente (20 o 22). La versión mínima no está
  fijada todavía en `package.json`; el toolchain de construcción requiere una
  LTS actual.
- **Un toolchain nativo** para compilar el módulo de base de datos, según el
  sistema operativo:
  - **Linux:** `build-essential` (compilador de C++) y `python3`.
  - **macOS:** las Command Line Tools de Xcode (`xcode-select --install`).
  - **Windows:** Visual Studio Build Tools con la carga de trabajo de escritorio
    de C++, y Python 3. El antiguo paquete `windows-build-tools` está
    descontinuado; no se usa.

## Clonar e instalar

```
git clone https://github.com/raisenomega/fortress.git
cd fortress
npm install
```

Al terminar `npm install`, un paso posterior recompila automáticamente el módulo
nativo de base de datos contra la versión de Electron del proyecto. Si ese paso
falla, casi siempre es porque falta el toolchain nativo del sistema operativo
(ver Requisitos).

## Arrancar en desarrollo

```
npm run dev
```

Levanta la aplicación con recarga en vivo. En el primer arranque, la aplicación
pide la clave de la API, que se guarda cifrada localmente y nunca cruza al
proceso de interfaz.

## Correr los tests

El gate mínimo —los tres comandos que todo cambio debe pasar— es:

```
npm run typecheck
npm run lint
npm run test:unit
```

La suite completa añade las pruebas de integración y de migración sobre la base
de datos real:

```
npm test
```

Hay además comprobaciones de interfaz: `npm run smoke` monta la interfaz y falla
si no pinta; `npm run preview` la siembra con datos y la captura.

Las pruebas de integración levantan Electron con un directorio de datos temporal
y abortan si la aplicación intenta reasignarlo, para no tocar la base de datos
real del operador. Y cuando cambies el escáner, corre `npm run verify:scan`:
lanza el motor de IA de verdad contra un proyecto vulnerable y comprueba que los
hallazgos salen del código y no de una plantilla. Tarda minutos, por eso queda
fuera de `npm test`.

## Construir el instalable

```
npm run build:linux     # AppImage para Linux
npm run build:mac       # macOS
npm run build:win       # Windows
```

La salida queda fuera del repositorio. El procedimiento de reconstruir e
instalar el binario ya instalado tiene sus propios cuidados; ver
[RELEASE](RELEASE.md) (por completar en la fase de documentación operativa).

## Estructura del proyecto

- `src/` — el código, en capas de dominios:
  - `src/domain` — entidades, objetos de valor y puertos; sin dependencias de
    Electron, React ni la base de datos.
  - `src/application` — los casos de uso, que orquestan el dominio.
  - `src/infrastructure` — los adaptadores concretos: base de datos, proveedor
    de IA, filesystem, git.
  - `src/presentation` — la interfaz (React y estado de interfaz).
  - `src/main`, `src/preload`, `src/renderer` — los procesos de Electron.

  Las reglas de dependencia están en [ARCHITECTURE](ARCHITECTURE.md).
- `docs/` — la documentación pública: la raíz más las carpetas `FLOWS/`,
  `PAGES/` y `DECISIONS/`.
- `templates/` — las plantillas universales que FORTRESS distribuye a los
  proyectos que audita; no documentan a FORTRESS mismo.
- `scripts/`, `resources/` — utilidades de construcción y activos.

**Lo que un clone NO contiene.** Varios archivos del operador están gitignored y
no aparecen al clonar: la carpeta `internal/` completa, y en la raíz `CLAUDE.md`
(la doctrina de agente del proyecto), `CONSTITUCION.md` (el manifiesto) y
`COGNITION-LOG.md` (el registro de aprendizaje continuo). Si la documentación
pública menciona uno de estos archivos —por ejemplo, ARCHITECTURE describe cómo
el runtime lee `CLAUDE.md`—, existe en el entorno del mantenedor pero no en tu
clone.

## Problemas de puesta a punto

- **`npm install` falla al compilar el módulo de base de datos** → falta el
  toolchain nativo; instala el de tu sistema operativo (ver Requisitos).
- **La aplicación no arranca en desarrollo** → verifica que tu Node.js es una
  LTS reciente (20 o 22).

Para problemas más allá de la puesta a punto, ver
[TROUBLESHOOTING](TROUBLESHOOTING.md) (por completar en la fase de documentación
operativa).

## Referencias

- [CONTRIBUTING](CONTRIBUTING.md) — las disciplinas y el proceso de
  contribución.
- [ARCHITECTURE](ARCHITECTURE.md) — las capas y las reglas duras.
