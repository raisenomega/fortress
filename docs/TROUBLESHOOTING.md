# Resolución de problemas

Esta guía recoge los problemas más comunes al instalar y usar FORTRESS Command
Center, con su causa probable y su solución. Está dirigida a quien usa la
aplicación; para poner en marcha un entorno de desarrollo, ver
[DEV-SETUP](DEV-SETUP.md).

Cada entrada sigue el mismo formato: el síntoma, la causa probable y qué hacer.
Cuando el detalle vive en otro documento, la entrada apunta allí.

## Instalación y arranque

### El AppImage no arranca en Linux

- **Síntoma:** al ejecutar el binario no ocurre nada, o aparece un error sobre
  FUSE.
- **Causa:** falta la biblioteca `libfuse2`, que los AppImage necesitan para
  montarse; las distribuciones recientes ya no la traen por defecto.
- **Solución:** instálala con el gestor de tu distribución:

  ```
  sudo apt install libfuse2      # Debian, Ubuntu
  sudo dnf install fuse-libs     # Fedora
  sudo pacman -S fuse2           # Arch
  ```

### El comando `fortress` no funciona en la terminal

- **Síntoma:** `fortress` devuelve "command not found", aunque la aplicación
  está instalada.
- **Causa:** `~/.local/bin` no está en tu `PATH`.
- **Solución:** añade a tu `~/.bashrc` la línea
  `export PATH="$HOME/.local/bin:$PATH"` y abre una terminal nueva. La
  aplicación también se abre desde el menú de aplicaciones o el acceso directo
  del escritorio.

### La instalación aborta diciendo que FORTRESS está en ejecución

- **Síntoma:** el instalador termina con un mensaje de abortado porque FORTRESS
  parece estar en ejecución.
- **Causa:** es un guardrail deliberado. Reemplazar el binario mientras la
  aplicación corre —el AppImage se ejecuta desde un montaje en vivo— la haría
  fallar.
- **Solución:** cierra FORTRESS por completo y vuelve a instalar. El detalle del
  procedimiento está en [RELEASE](RELEASE.md).

## Configuración inicial

### La aplicación pide una clave de API al arrancar

- **Síntoma:** al abrir por primera vez, FORTRESS pide una clave antes de dejar
  usar nada.
- **Causa:** es la pantalla de alta; sin una clave válida, la aplicación no
  puede hablar con el proveedor de IA.
- **Solución:** introduce tu clave. Se guarda cifrada localmente y nunca cruza
  al proceso de interfaz. Ver [PAGES/onboarding](PAGES/onboarding.md).

### El chat está bloqueado en un proyecto nuevo

- **Síntoma:** en un proyecto recién añadido, el chat no responde con normalidad
  o redirige a una entrevista.
- **Causa:** un proyecto nuevo nace pendiente de configuración; el chat se
  desbloquea cuando la configuración guiada termina.
- **Solución:** completa la entrevista de configuración. Ver
  [FLOWS/CHAT](FLOWS/CHAT.md) y [PAGES/nuevo-proyecto](PAGES/nuevo-proyecto.md).

## Motor de auto-reparación

### Una propuesta aparece como caducada sin causa clara

- **Síntoma:** una propuesta que avanzaba bien queda en estado caducado.
- **Causa:** el repositorio se movió después de que el motor analizara el
  hallazgo. El motor nunca hace un rebase automático: si el punto de partida ya
  no es el actual, la propuesta caduca.
- **Solución:** genera una propuesta nueva sobre el estado actual. Ver
  [FLOWS/SELF-REPAIR](FLOWS/SELF-REPAIR.md) y [FLOWS/RETRY](FLOWS/RETRY.md).

### No aparece la opción de reintentar una propuesta rechazada

- **Síntoma:** una propuesta se rechazó y no hay forma de reintentarla.
- **Causa:** solo los rechazos por razones de razonamiento ofrecen reintento.
  Los rechazos técnicos —presupuesto agotado, tiempo excedido, espacio de
  trabajo perdido— no lo ofrecen: repetir sin arreglar la causa daría lo mismo.
- **Solución:** si el rechazo fue técnico, atiende la causa; el detalle de qué
  rechazos admiten reintento está en [FLOWS/RETRY](FLOWS/RETRY.md).

### La opción de reintento no aparece en la aplicación instalada

- **Síntoma:** la documentación describe el reintento, pero la aplicación
  instalada no lo muestra.
- **Causa:** el binario instalado es más antiguo que el código del repositorio;
  una capacidad reciente aún no está en el AppImage que tienes.
- **Solución:** reconstruye e instala en frío. Ver [RELEASE](RELEASE.md).

## Escaneo y auditoría

### Un hallazgo que descartaste vuelve a aparecer

- **Síntoma:** un hallazgo que habías descartado reaparece tras un nuevo
  escaneo.
- **Causa:** el descarte se ancla a la huella del hallazgo, y esa huella incluye
  su título. Si el título cambió entre escaneos, el sistema lo trata como un
  hallazgo distinto.
- **Solución:** vuelve a descartarlo; es el comportamiento esperado. Ver
  [FLOWS/SCAN](FLOWS/SCAN.md).

### El push está bloqueado

- **Síntoma:** la aplicación no deja hacer push.
- **Causa:** hay al menos un hallazgo de severidad crítica activo. El bloqueo es
  una regla dura del dominio.
- **Solución:** resuelve o descarta con criterio el hallazgo crítico. Ver
  [FLOWS/SCAN](FLOWS/SCAN.md) y [SECURITY-MODEL](SECURITY-MODEL.md).

## Grafo de conocimiento

### El grafo lista proyectos con nombres temporales

- **Síntoma:** el listado de proyectos del grafo muestra entradas del tipo
  `tmp-fortress-genesis-*`.
- **Causa:** son espacios de trabajo efímeros del bucle de génesis, creados en
  el directorio temporal del sistema. No son proyectos reales.
- **Solución:** se pueden ignorar; no afectan a tus proyectos. Es una deuda
  conocida del reindexado, sin impacto funcional.

## Base de datos

### La base de datos parece bloqueada

- **Síntoma:** la aplicación no lee o no escribe, o avisa de un bloqueo de la
  base de datos.
- **Causa:** hay otra instancia de FORTRESS abierta sobre la misma base.
- **Solución:** cierra las demás instancias y vuelve a abrir una sola.

## Cómo reportar un problema nuevo

Si tu problema no está aquí, revisa primero [DEV-SETUP](DEV-SETUP.md) cuando sea
de puesta a punto, y la documentación del área en [FLOWS/](FLOWS/SELF-REPAIR.md).
Para reportar, abre un issue en el repositorio del proyecto
(`github.com/raisenomega/fortress`) describiendo el síntoma, los pasos para
reproducirlo y tu sistema operativo.

## Referencias

- [DEV-SETUP](DEV-SETUP.md) — puesta a punto del entorno de desarrollo.
- [RELEASE](RELEASE.md) — instalación y reconstrucción del binario.
- [FLOWS/](FLOWS/SELF-REPAIR.md) — los flujos operativos en detalle.
