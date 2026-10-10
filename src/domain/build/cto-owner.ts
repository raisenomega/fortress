/**
 * El owner (carril) del turno del CTO (PASO 126/149): NO es un projectId real,
 * es el sentinel del cuarto propio del CTO en userData. Compartido por el main
 * —run-cto registra su proceso bajo el, y el Detener lo corta por el— y el
 * renderer. Vale lo mismo que el nombre del cuarto, para que parar el CTO
 * alcance exactamente su proceso y jamas el de un proyecto anclado.
 */
export const CTO_OWNER = 'chat-cto'
