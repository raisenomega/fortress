import { ESCALERA } from '../agent/escalera-de-modelos'

/**
 * El modelo que la fila AGREGADA del escaneo puede afirmar: `undefined` mientras
 * no haya paradas; `null` en cuanto UNA no reporto el suyo —afirmar un modelo
 * que no consta seria inferir—; y con todas reportando, el comun si fueron
 * uniformes o el del PELDANO MAS BAJO visto si hubo mezcla, que es justo el que
 * la doctrina del modelo quiere cazar (ADR-078).
 *
 * La escalera distingue PELDANOS, no versiones: dos opus de version distinta
 * empatan y se queda el ya visto (fold estable). El aviso del fallback viejo ya
 * lo dio el guardian del turno; aqui no se repite ese juicio.
 */
export type ModeloDelRecorrido = string | null | undefined

/** Rango por la escalera LEIDA (0 = cima). Una familia que no esta en ella
 *  cuenta como la mas baja: a lo que no se puede situar no se le afirma altura. */
const rango = (id: string): number => {
  const indice = ESCALERA.findIndex((peldano) => id.includes(peldano))
  return indice === -1 ? ESCALERA.length : indice
}

const masBajo = (visto: string, nuevo: string): string => (rango(nuevo) > rango(visto) ? nuevo : visto) // prettier-ignore

/** Suma el modelo de UNA parada terminada al acumulado del recorrido. */
export function sumarModelo(
  previo: ModeloDelRecorrido,
  delTurno: string | undefined
): ModeloDelRecorrido {
  if (previo === null || delTurno === undefined) return null
  if (previo === undefined) return delTurno
  return masBajo(previo, delTurno)
}

/** Lo que se escribe: `null` y «sin paradas» acaban igual — fila sin modelo. */
export const paraLaFila = (modelo: ModeloDelRecorrido): string | undefined => modelo ?? undefined
