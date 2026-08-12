# ADR-033: Claude Code CLI en vez del SDK

**Estado:** Aceptada
**Fecha:** 2026-08-01
**Autor:** operador (registro retroactivo, 2026-08-11)

## Contexto

El PRD asumía hablar con el proveedor por su SDK de mensajes. Pero FORTRESS
no es un chat: su agente debe ACTUAR dentro del proyecto — leer archivos,
editarlos, correr verificaciones — no solo responder texto. Eso exige un
motor con acceso real al filesystem y a herramientas, en el directorio del
proyecto.

Al integrarlo se descubrió, verificando contra el binario real, que las
banderas que uno esperaría (`--headless`, `--project`) NO existen: el modo
correcto es `-p` con el `cwd` apuntando a la carpeta del proyecto y salida
en stream-json.

## Alternativas consideradas

- **SDK de mensajes exclusivo:** descartada — da conversación pero no el
  modo agente con herramientas que actúan sobre el filesystem.
- **CLI con una bandera `--headless` imaginaria:** descartada — no existe en
  el binario; se comprobó verificando la ayuda real, no asumiendo.

## Decisión

El motor de agente es Claude Code ejecutado como CLI (`-p` con el `cwd` en
la carpeta del proyecto, salida stream-json). Cuando el CLI no está
disponible, un fallback por API responde solo-texto (ver el motor dual del
chat). La abstracción que hace esto intercambiable es un puerto del dominio
(ADR-057).

## Consecuencias

### Positivas
- El agente ejecuta de verdad dentro del proyecto (lee, edita, verifica).
- El descubrimiento de las banderas reales quedó documentado, no perdido.

### Negativas
- Depende de un binario externo instalado; el fallback por API es limitado.

### Neutras
- El coste de una corrida se lee de la salida del CLI, no se estima.

## Referencias

- [FLOWS/CHAT](../FLOWS/CHAT.md) — el motor dual (CLI o API) por
  disponibilidad.
- [PRINCIPLES](../PRINCIPLES.md) — el código (y el binario) como fuente de
  verdad.
- ADR-057 (el puerto que abstrae el proveedor).
