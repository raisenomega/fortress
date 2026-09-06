import type { RunOmegaResult } from './run-omega'

/**
 * Lo que el puente lleva de vuelta al operador cuando firma un juicio: el
 * veredicto Y si ademas se integro.
 *
 * Antes viajaba solo el veredicto, y estaba razonado —"el puente lleva el
 * juicio; la adaptacion vive en la frontera"—, pero ese recorte tenia una
 * consecuencia que nadie habia mirado: cuando el juicio arrastraba una
 * integracion detras, el operador no se enteraba. El aviso de "integrada" se
 * emitia mirando el estado ANTERIOR de la propuesta, asi que solo salia por el
 * camino en el que ya se sabia de antemano. Un dato que la interfaz necesita
 * para no mentir no es empobrecer el contrato: es el contrato.
 */
export type JuicioConIntegracion = RunOmegaResult & { readonly integrada: boolean }
