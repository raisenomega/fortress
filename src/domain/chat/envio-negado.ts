/**
 * Un envio que una PUERTA del main nego ANTES de que el turno existiera.
 *
 * Por fuera es un `Result` fallido como cualquier otro, y por eso mismo hacia
 * falta nombrarlo: un turno que REVIENTA vuelve igual —`ok: false` y unas
 * palabras—, pero ese turno existio, gasto y pudo editar. Son dos cosas, y la
 * cola del lote las trataba como una. Medido el 2026-09-21: la barrera nego tres
 * ejecuciones y en el hilo solo quedo «3 no cerraron (degradaron, revirtieron o
 * sin cambios)», que no nombra la causa. El aviso de pantalla muere al reiniciar.
 *
 * La puerta es un vocabulario CERRADO de FORTRESS. Las palabras pueden llevar
 * texto del proyecto auditado, y por eso no viajan en el enum: van al parte.
 */
export const PUERTAS_DEL_ENVIO = ['barrera', 'plan-sin-aprobar', 'carril'] as const

export type PuertaDelEnvio = (typeof PUERTAS_DEL_ENVIO)[number]

export interface EnvioNegado {
  readonly ok: false
  readonly error: string
  readonly puerta: PuertaDelEnvio
}

/** Lo que la cola necesita de una negativa: que puerta, y con que palabras. */
export interface Negativa {
  readonly puerta: PuertaDelEnvio
  readonly motivo: string
}

export const negado = (puerta: PuertaDelEnvio, error: string): EnvioNegado => ({
  ok: false,
  error,
  puerta
})

export function esEnvioNegado(resultado: { readonly ok: boolean }): resultado is EnvioNegado {
  const puerta = (resultado as { puerta?: unknown }).puerta
  return !resultado.ok && (PUERTAS_DEL_ENVIO as readonly unknown[]).includes(puerta)
}
