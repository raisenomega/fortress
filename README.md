# FORTRESS Command Center

Aplicación de escritorio para gestionar múltiples proyectos de código con
agentes de IA: escaneo de seguridad con agentes especializados, chat con Claude
por proyecto, motor disciplinado de auto-reparación con firma humana, y
diagnóstico del propio sistema. Electron + React + TypeScript. Todo corre en
local: no hay servidores propios ni telemetría.

## Estado del proyecto

- **Versión:** 1.0.0 (`fortress-command-center`)
- **Estado:** desarrollo activo (pre-producción)
- **Última actualización:** 2026-08-11

## Documentación

- `docs/` — Documentación pública del proyecto FORTRESS. Ya contiene
  `OVERVIEW.md` (qué es, estado honesto) y `ARCHITECTURE.md` (capas, reglas,
  runtime); el resto en construcción (Fase 1 del plan documental).
- `templates/` — Plantillas universales que FORTRESS distribuye a otros
  proyectos (CLAUDE.md, ARCHITECTURE.md, framework de seguridad, agentes,
  etc.). NO son documentación de FORTRESS mismo; ver `templates/README.md`.
- `internal/` — Documentación interna del operador (gitignored).

### Archivos en la raíz

- `CLAUDE.md` — doctrina interna del proyecto para agentes que operan sobre
  FORTRESS (Claude Code, agentes del motor). NO confundir con
  `templates/CLAUDE.md`, la plantilla universal que FORTRESS distribuye a
  otros proyectos.
- `COGNITION-LOG.md` — log operativo del sistema: lo leen y escriben el motor
  de escaneo y los agentes en runtime. Path fijo por diseño.
- `CONSTITUCION.md` — manifiesto filosófico presente en raíz del proyecto. Su
  ubicación final se decidirá en Fase 1 (tarea 1.7).

## Desarrollo

```bash
npm install
npm run dev
```

Al abrirla por primera vez pide la API key de Claude. Se valida contra la API,
se cifra con el keychain del sistema y **nunca sale de tu máquina**. También
sirve exportar `ANTHROPIC_API_KEY` antes de arrancar.

## Verificación

```bash
npm run typecheck   # tsc en node + web
npm run lint        # incluye el límite de 75 líneas por archivo
npm run test:unit   # vitest: dominio puro + persistencia sobre SQLite en memoria
npm test            # unit + integración (renderer -> preload -> IPC -> SQLite)
npm run smoke       # monta la UI real y falla si no pinta
npm run preview     # recorre las pantallas y las captura
npm run verify:scan # escaneo REAL contra un proyecto vulnerable (tarda minutos)
```

Los que levantan Electron usan un `userData` temporal: nunca tocan tu base de
datos real.

## Distribución (Linux)

> **Regla no negociable: cierra la app ANTES de instalar.** El AppImage se ejecuta
> desde un mount FUSE en caliente; sobrescribir `~/.local/bin/fortress` con la app
> corriendo la crashea. `install.sh` lo hace cumplir (`refuse_if_running` aborta si
> detecta la app viva y verifica el PID antes y después); aun así, el flujo correcto
> es: cerrar la app -> build -> install -> relanzar fresca. Nunca en caliente.

```bash
# 1. cierra FORTRESS por completo
npm run icons         # regenera los iconos desde resources/fortress-logo.jpeg
npm run build:linux   # genera ../dist/FORTRESS-<version>.AppImage
./install.sh          # copia el binario (aborta si la app sigue viva)
# 4. relanza la app fresca
```

`install.sh` no necesita sudo. Deja:

| Qué             | Dónde                                                    |
| --------------- | -------------------------------------------------------- |
| Ejecutable      | `~/.local/bin/fortress`                                  |
| Entrada de menú | `~/.local/share/applications/fortress.desktop`           |
| Acceso directo  | `~/Escritorio/FORTRESS.desktop`                          |
| Icono           | `~/.local/share/icons/hicolor/512x512/apps/fortress.png` |

Los AppImage necesitan `libfuse2` (`sudo apt install libfuse2`); el instalador
avisa si falta. Para mac y win están `npm run build:mac` y `build:win`.

## Arquitectura

Capas DDD con dependencias hacia adentro: `presentation -> application ->
domain` e `infrastructure -> domain`. El dominio no importa de ninguna otra
capa y no conoce Electron, React ni SQLite.

Reglas de código y detalle de cada capa: `docs/ARCHITECTURE.md`.

## Dónde vive tu información

Todo en este equipo, nada en servidores propios:

- Proyectos, historial de chat y ajustes: SQLite en la carpeta de datos de la
  app (`~/.config/fortress-command-center/fortress.db` en Linux).
- API key: cifrada con `safeStorage`. Solo el proceso principal la descifra;
  el renderer únicamente puede preguntar si existe.
- Las peticiones salen del proceso principal directo a la API de Anthropic.

## Licencia y contacto

- **Propietario:** raisenomega
- **Repositorio:** <https://github.com/raisenomega/fortress> (privado)
- **Licencia:** por definir; todos los derechos reservados mientras tanto.
