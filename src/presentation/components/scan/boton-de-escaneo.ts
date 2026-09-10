/**
 * Que boton toca. Tres estados y no dos, porque «hay un escaneo» y «hay un
 * escaneo MIO» dejaron de ser lo mismo cuando el recorrido gano su Detener:
 * sobre el propio proyecto se para, sobre otro solo se espera.
 */
export type BotonDeEscaneo = 'detener' | 'escanear' | 'ocupado'

export function botonDeEscaneo(runningProjectId: string | null, projectId: string): BotonDeEscaneo {
  if (runningProjectId === projectId) return 'detener'
  return runningProjectId === null ? 'escanear' : 'ocupado'
}
