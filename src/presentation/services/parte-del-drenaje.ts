import type { DrenajeResultado, FinDelDrenaje } from '@application/repair/drenar-hasta-omega'
import type { NoticeTone } from '../components/common/Notice'

/** Por que se detuvo, en una frase. Solo agotar el pozo es un exito. */
const CIERRE: Record<FinDelDrenaje, { texto: string; tono: NoticeTone }> = {
  'sin-candidato': { texto: 'no queda nada elegible', tono: 'ok' },
  // No es un pozo agotado: el Motor solo repara FORTRESS (ADR-107).
  negado: { texto: 'este proyecto se repara por el Terminal', tono: 'aviso' },
  'tope-vueltas': { texto: 'tope de vueltas alcanzado', tono: 'aviso' },
  'tope-gasto': { texto: 'tope de gasto alcanzado', tono: 'aviso' },
  detenido: { texto: 'detenido por ti', tono: 'aviso' },
  // No es un fallo: es un freno del sistema. Por eso aviso y no error — pintarlo
  // de rojo mandaba a buscar una averia que nunca existio.
  ocupado: { texto: 'no arranco: el motor esta ocupado', tono: 'aviso' },
  averia: { texto: 'cortado por una averia', tono: 'error' },
  entorno: { texto: 'cortado: el CLI no arranca en esta maquina', tono: 'error' }
}

/**
 * Las bajas, cada una con su causa. Una baja sin causa no se puede aprender —y
 * una con la causa EQUIVOCADA es peor: "por gate o correa" mandaba a leer un
 * diff que, para doce de los quince motivos que caian ahi, no existia.
 *
 * Cada linea nombra la accion que le toca al operador, que es lo que agrupa las
 * casillas: leer el diff, mirar su proyecto, o abrirnos un issue.
 */
const LINEAS: ReadonlyArray<readonly [keyof DrenajeResultado, (n: number) => string]> = [
  ['vetadas', (n) => `${n} vetada${n > 1 ? 's' : ''} por el revisor`],
  ['porPresupuesto', (n) => `${n} por presupuesto`],
  ['porTimeout', (n) => `${n} por timeout`],
  ['porCorrea', (n) => `${n} por el gate o la correa`],
  ['porLimitePropio', (n) => `${n} sin turnos (no se llego a juzgar el fix)`],
  ['porEntornoDelProyecto', (n) => `${n} por el entorno del proyecto`],
  ['porDefectoInterno', (n) => `${n} por un fallo nuestro, no de la propuesta`],
  ['superadas', (n) => `${n} reemplazada${n > 1 ? 's' : ''} o reclamada${n > 1 ? 's' : ''}`],
  ['sinClasificar', (n) => `${n} con un motivo que no sabemos nombrar`]
]

function bajas(r: DrenajeResultado): string {
  const partes = LINEAS.filter(([k]) => (r[k] as number) > 0).map(([k, texto]) => texto(r[k] as number)) // prettier-ignore
  return partes.length === 0 ? '' : ` Se perdieron ${partes.join(', ')}.`
}

/** Las colisiones de fichero de la corrida: AVISO, no bloqueo — el drenaje deja
 *  de ser mudo, pero quien adjudica sigue siendo `medirLaTanda`/la firma. */
function choques(r: DrenajeResultado): string {
  const n = r.colisiones.length
  // prettier-ignore
  return n === 0 ? '' : ` ${n} colision${n > 1 ? 'es' : ''} de fichero en la corrida (aviso, no bloquea).`
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
  return { texto: `${cabeza}${bajas(r)}${choques(r)} Fin: ${cierre}.`, tono }
}
