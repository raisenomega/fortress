export const WINDOWS = ['hoy', 'semana', 'mes'] as const

export type TimeWindow = (typeof WINDOWS)[number]

const DAY_MS = 24 * 60 * 60 * 1000
const DAYS: Record<TimeWindow, number> = { hoy: 1, semana: 7, mes: 30 }

/**
 * Inicio de la ventana, en ISO. Recibe `now` en vez de mirar el reloj: una
 * funcion que consulta la hora por su cuenta no se puede probar.
 *
 * "Hoy" es desde medianoche, no las ultimas 24 horas. Es lo que espera quien
 * pregunta cuanto lleva gastado hoy.
 */
export function windowStart(now: Date, window: TimeWindow): string {
  if (window === 'hoy') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return start.toISOString()
  }

  return new Date(now.getTime() - DAYS[window] * DAY_MS).toISOString()
}

export const WINDOW_LABEL: Record<TimeWindow, string> = {
  hoy: 'Hoy',
  semana: 'Ultimos 7 dias',
  mes: 'Ultimos 30 dias'
}
