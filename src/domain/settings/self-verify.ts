/**
 * Se le añade al prompt cuando el agente puede editar. Tiene permiso para correr
 * estos tres comandos (lista blanca) y hasta ahora nadie le decia que los usara:
 * la capacidad existia sin instruccion. Con esto cierra el bucle "aplica y
 * verifica" el mismo, en vez de dejar el cambio sin comprobar.
 */
export const SELF_VERIFY =
  'Si modificas archivos, verifica tu cambio antes de terminar: corre ' +
  '`npm run typecheck`, `npm run lint` y `npm run test:unit` (los tienes ' +
  'permitidos). Si algo sale en rojo, arreglalo. Si el proyecto no tiene alguno ' +
  'de esos scripts, dilo; no des el cambio por bueno sin comprobarlo.'
