# FORTRESS Command Center

App de escritorio para gestionar varios proyectos de codigo con agentes de IA:
chat con Claude por proyecto, panel multi-proyecto con scores y diagnostico del
propio sistema. Electron + React + TypeScript, todo en local.

## Desarrollo

```bash
npm install
npm run dev
```

Al abrirla por primera vez pide la API key de Claude. Se valida contra la API,
se cifra con el keychain del sistema y **nunca sale de tu maquina**. Tambien
sirve exportar `ANTHROPIC_API_KEY` antes de arrancar.

## Verificacion

```bash
npm run typecheck   # tsc en node + web
npm run lint        # incluye el limite de 75 lineas por archivo
npm run test:unit   # vitest: dominio puro + persistencia sobre SQLite en memoria
npm test            # unit + integracion (renderer -> preload -> IPC -> SQLite)
npm run smoke       # monta la UI real y falla si no pinta
npm run preview     # recorre las 6 pantallas y las captura
```

Los que levantan Electron usan un `userData` temporal: nunca tocan tu base de
datos real.

## Distribucion (Linux)

> **Regla no negociable: cierra la app ANTES de instalar.** El AppImage se ejecuta
> desde un mount FUSE en caliente; sobrescribir `~/.local/bin/fortress` con la app
> corriendo la crashea. `install.sh` lo hace cumplir (`refuse_if_running` aborta si
> detecta la app viva y verifica el PID antes y despues); aun asi, el flujo correcto
> es: cerrar la app -> build -> install -> relanzar fresca. Nunca en caliente.

```bash
# 1. cierra FORTRESS por completo
npm run icons         # regenera los iconos desde resources/fortress-logo.jpeg
npm run build:linux   # genera ../dist/FORTRESS-<version>.AppImage
./install.sh          # copia el binario (aborta si la app sigue viva)
# 4. relanza la app fresca
```

`install.sh` no necesita sudo. Deja:

| Que             | Donde                                                    |
| --------------- | -------------------------------------------------------- |
| Ejecutable      | `~/.local/bin/fortress`                                  |
| Entrada de menu | `~/.local/share/applications/fortress.desktop`           |
| Acceso directo  | `~/Escritorio/FORTRESS.desktop`                          |
| Icono           | `~/.local/share/icons/hicolor/512x512/apps/fortress.png` |

Los AppImage necesitan `libfuse2` (`sudo apt install libfuse2`); el instalador
avisa si falta. Para mac y win estan `npm run build:mac` y `build:win`.

## Arquitectura

Capas DDD con dependencias hacia adentro: `presentation -> application ->
domain` e `infrastructure -> domain`. El dominio no importa de ninguna otra
capa y no conoce Electron, React ni SQLite.

Reglas de codigo y detalle de cada capa: `CLAUDE.md`.

## Donde vive tu informacion

Todo en este equipo, nada en servidores propios:

- Proyectos, historial de chat y ajustes: SQLite en la carpeta de datos de la
  app (`~/.config/fortress-command-center/fortress.db` en Linux).
- API key: cifrada con `safeStorage`. Solo el proceso principal la descifra;
  el renderer unicamente puede preguntar si existe.
- Las peticiones salen del proceso principal directo a la API de Anthropic.
