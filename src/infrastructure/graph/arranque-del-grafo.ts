import { barrerGrafosDeTurnos } from './grafo-del-turno'
import { fijarRaizDeGrafosDeTurno } from './raiz-de-grafos-de-turno'
import { reconcileAllOnBoot } from './reconcile-service'

/** El grafo al arrancar: fija la raiz de los turnos, barre lo que un cierre dejo, y reconcilia. */
export function arrancarGrafo(userData: string): void {
  const barridos = barrerGrafosDeTurnos(fijarRaizDeGrafosDeTurno(userData))
  if (barridos > 0) console.info('[grafo-por-turno] barridos', barridos, 'directorios huerfanos')
  reconcileAllOnBoot()
}
