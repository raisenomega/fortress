import type { DrenajeResultado, FinDelDrenaje } from '@application/repair/drenar-hasta-omega'
import type { NoticeTone } from '../components/common/Notice'

/** Por que se detuvo, en una frase. Solo agotar el pozo es un exito. */
const CIERRE: Record<FinDelDrenaje, { texto: string; tono: NoticeTone }> = {
  'sin-candidato': { texto: 'no queda nada elegible', tono: 'ok' },
  'tope-vueltas': { texto: 'tope de vueltas alcanzado', tono: 'aviso' },
  'tope-gasto': { texto: 'tope de gasto alcanzado', tono: 'aviso' },
  detenido: { texto: 'detenido por ti', tono: 'aviso' },
  averia: { texto: 'cortado por una averia', tono: 'error' },
  entorno: { texto: 'cortado: el CLI no arranca en esta maquina', tono: 'error' }
}

/** Las bajas, cada una con su causa. Una baja sin causa no se puede aprender. */
function bajas(r: DrenajeResultado): string {
  const partes = [
    r.vetadas > 0 ? `${r.vetadas} vetada${r.vetadas > 1 ? 's' : ''} por el revisor` : '',
    r.porPresupuesto > 0 ? `${r.porPresupuesto} por presupuesto` : '',
    r.porTimeout > 0 ? `${r.porTimeout} por timeout` : '',
    r.otrasBajas > 0 ? `${r.otrasBajas} por gate o correa` : ''
  ].filter((p) => p !== '')
  return partes.length === 0 ? '' : ` Se perdieron ${partes.join(', ')}.`
}

/**
 * El parte de una corrida: que HIZO, no solo que quedo.
 *
 * Antes decia cuantas esperaban firma y se callaba el resto, asi que una corrida
 * que trabajo tres y perdio una por presupuesto se leia como si hubiera hecho
 * dos — y pareció que el drenaje habia parado antes de tiempo cuando en realidad
 * habia agotado el pozo. Un parte que omite las bajas convierte un final normal
 * en un misterio.
 */
export function parteDelDrenaje(r: DrenajeResultado): { texto: string; tono: NoticeTone } {
  const { texto: cierre, tono } = CIERRE[r.fin]
  if (r.trabajadas === 0) return { texto: `Drenaje sin trabajo: ${cierre}.`, tono }

  const cabeza = `Drenaje: ${r.trabajadas} trabajada${r.trabajadas > 1 ? 's' : ''}, ${r.acumuladas} esperando firma.` // prettier-ignore
  return { texto: `${cabeza}${bajas(r)} Fin: ${cierre}.`, tono }
}
