/** "1m 03s" o "12s": lo que el operador necesita para saber si tardo mucho. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

/** Fecha local legible: el ISO que guarda la base no lo lee nadie de un vistazo. */
export function formatMoment(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'fecha desconocida'

  // Ano completo a proposito: "2/8/26" en un informe de seguridad se presta a
  // leerse como otra fecha, y aqui importa saber cuando se midio.
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
