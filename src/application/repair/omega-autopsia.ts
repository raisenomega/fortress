import type { OmegaAgentResult } from './run-omega'

type Fallo = Extract<OmegaAgentResult, { ok: false }>

/**
 * La evidencia de la corrida de OMEGA: el veredicto si lo hubo, la autopsia
 * entera si no.
 *
 * Viaja por el mismo canal que usa el gate para la suya —el `evidenceJson` del
 * evento AGENT_RUN, que ya se emitia— y lleva el crudo SIN recortar: el fallo
 * es raro y una muestra no basta para reproducirlo. Antes este objeto solo
 * llevaba la constante generica, y una propuesta que habia pasado el gate en
 * verde se perdia sin que nadie pudiera saber que habia devuelto el juez.
 */
export function evidenciaOmega(crudo: OmegaAgentResult, diffFiles: readonly string[]): object {
  if (crudo.ok) return { verdict: crudo.verdict, diffFiles }
  return { error: crudo.error, detail: crudo.detail, raw: crudo.raw, diffFiles }
}

/**
 * Como se asienta un fallo del juez: la razon se queda CANONICA —es una union
 * cerrada del dominio y el libro la necesita estable para agrupar— y el
 * diagnostico preciso la acompana en el detalle, que es lo que lee un humano.
 *
 * Separar clasificacion de diagnostico es lo que permite conservar el segundo
 * sin mover la primera.
 */
export function falloDeOmega(fallo: Fallo): {
  reason: string
  detalle: string
  evidencia: object
} {
  // El CLI que no arranco va primero: sin proceso no hubo respuesta que juzgar
  // ni plazo que cumplir, asi que las otras dos preguntas no aplican.
  // prettier-ignore
  const reason = fallo.noArranco === true ? 'cli_no_arranco' : fallo.error === 'omega_response_invalid' ? 'omega_response_invalid' : fallo.timedOut ? 'omega_timeout' : 'omega_error'
  const detalle = fallo.detail === undefined ? reason : `${reason}: ${fallo.detail}`
  return { reason, detalle, evidencia: { error: fallo.error, detail: fallo.detail } }
}
