/** Canales del Chat (historial, hilos B1, barra de carpetas 116/118).
 *  Separados de channels.ts por tamano, molde de omega-channels. */
export const CHAT_CHANNELS = {
  chatHistory: 'chat:history',
  chatAppend: 'chat:append',
  chatClear: 'chat:clear',
  chatCreateHilo: 'chat:create-hilo',
  chatListHilos: 'chat:list-hilos',
  chatListByHilo: 'chat:list-by-hilo',
  chatAddToHilo: 'chat:add-to-hilo',
  chatListarCarpetas: 'chat:listar-carpetas',
  chatListarSueltos: 'chat:listar-sueltos',
  chatBorrarHilo: 'chat:borrar-hilo',
  chatCrearCarpeta: 'chat:crear-carpeta',
  chatHilosPorCarpeta: 'chat:hilos-por-carpeta',
  chatSend: 'chat:send',
  chatStop: 'chat:stop',
  chatChunk: 'chat:chunk',
  chatProgress: 'chat:progress'
} as const
