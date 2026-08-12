# Instalación y distribución

Esta guía describe cómo se instala y se actualiza FORTRESS Command Center, y el
estado real de su distribución. Está dirigida a quien consume la aplicación;
para construirla desde el código, ver [DEV-SETUP](DEV-SETUP.md).

## Estado de la distribución

- **Linux (AppImage)** es la distribución primaria y funcional. Se genera desde
  el proyecto y se instala con el script incluido (ver más abajo).
- **macOS** (imagen de disco y zip) y **Windows** (instalador y portable) están
  configurados en el empaquetador, pero se construyen **sin firma ni
  notarización** y no se han distribuido ni probado en producción.
- **La firma criptográfica del binario** en las tres plataformas es una
  dirección planificada, no una realidad presente. Ver [ROADMAP](ROADMAP.md).

No hay compromisos de plazo. Cuando la firma y la distribución multiplataforma
existan, serán hitos registrados en [CHANGELOG](CHANGELOG.md).

## Qué incluye el binario

El binario contiene la aplicación y solo la aplicación. Los documentos internos
del operador y el kit de plantillas que FORTRESS distribuye a otros proyectos
quedan fuera del instalable a propósito: no viajan en él. El módulo nativo de
base de datos sí viaja, empaquetado de forma que pueda cargarse en tiempo de
ejecución.

## Instalación en Linux

El binario para Linux es un AppImage. Para ejecutarse necesita `libfuse2` en el
sistema, que las distribuciones recientes ya no traen por defecto:

```
sudo apt install libfuse2      # Debian, Ubuntu
sudo dnf install fuse-libs     # Fedora
sudo pacman -S fuse2           # Arch
```

Con el AppImage ya construido (`npm run build:linux`, ver
[DEV-SETUP](DEV-SETUP.md)), el script de instalación lo coloca en el espacio del
usuario, sin `sudo`:

```
./install.sh
```

El script copia el binario a `~/.local/bin/fortress`, e instala el icono, una
entrada de menú y un acceso directo en el escritorio. Para lanzar `fortress`
desde la terminal, `~/.local/bin` debe estar en tu `PATH`.

## Reconstrucción en frío del binario

El binario instalado no se reemplaza mientras la aplicación corre: el AppImage
se ejecuta desde un montaje en vivo, y sobrescribirlo bajo el proceso activo lo
hace fallar. El procedimiento seguro, siempre con la aplicación cerrada, es:

1. **Cerrar FORTRESS por completo.**
2. Reconstruir el binario: `npm run build:linux`.
3. Instalar: `./install.sh`. El script comprueba que la aplicación no está viva
   antes de tocar el binario, y vuelve a comprobarlo después de instalar.
4. **Relanzar la aplicación** ya reconstruida.

Reemplazar el binario en caliente no es un atajo: es un fallo esperando ocurrir.

## Construir para macOS y Windows

Los artefactos de macOS y Windows se construyen con `npm run build:mac` y
`npm run build:win`. Producen, respectivamente, una imagen de disco y un zip, y
un instalador y un ejecutable portable, todos **sin firma**. Sirven para pruebas
locales; no son una distribución de producción hasta que la firma del binario
exista (ver [ROADMAP](ROADMAP.md)). La salida queda fuera del repositorio, junto
al AppImage de Linux.

## Verificación de la instalación

El script informa del resultado: la ruta del ejecutable, el origen del AppImage,
la entrada de menú y el acceso directo. Sus dos comprobaciones de seguridad —que
la aplicación no estaba viva antes de instalar y que no quedó un proceso tras
instalar— se imprimen como parte de la salida. Si alguna avisa de que FORTRESS
parece en ejecución, cierra todas las instancias y repite.

## Actualizaciones

FORTRESS no tiene actualización automática. El binario instalado puede quedar
desfasado respecto a la versión más reciente del repositorio. Cuando aparezcan
hitos nuevos en [HISTORY](HISTORY.md) o [CHANGELOG](CHANGELOG.md) que quieras
consumir, la reconstrucción en frío descrita arriba es el mecanismo de
actualización manual. La actualización automática es una dirección del
[ROADMAP](ROADMAP.md).

## Requisitos por sistema operativo

- **Linux:** `libfuse2` para ejecutar el AppImage, y `~/.local/bin` en el `PATH`
  para el comando de terminal.
- **macOS y Windows:** sin distribución firmada todavía (ver Estado de la
  distribución).

## Referencias

- [DEV-SETUP](DEV-SETUP.md) — construir el binario desde el código.
- [ROADMAP](ROADMAP.md) — la firma del binario y la actualización automática,
  planificadas.
- [HISTORY](HISTORY.md), [CHANGELOG](CHANGELOG.md) — qué contiene cada hito.
- [TROUBLESHOOTING](TROUBLESHOOTING.md) — problemas de instalación y uso.
