import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import type { AutoMergeDeps } from './auto-merge-types'

/** Lo que devuelve el gate del motor cuando el arbol integrado esta sano. */
export const MEDIDA_VERDE: MedidaDelArbol = {
  ok: true, comandos: ['typecheck', 'lint', 'test:unit'], detalle: ''
} // prettier-ignore

export interface OpcionesDelArbol {
  /** Ficheros que el destino toco desde la base. Sin poner = no se movio.
   *  null = no se pudo saber, que es un caso distinto y se prueba aparte. */
  readonly destino?: readonly string[] | null
  /** Que dio el gate del motor sobre el arbol integrado. */
  readonly medida?: MedidaDelArbol
}

/**
 * Los dos puertos de la medida, con la cuenta de a quien se llamo. Esa cuenta es
 * la mitad de lo que hay que probar: que una tanda de firmas sobre ficheros
 * distintos NO dispara ninguna medida es un test sobre lo que no se ejecuto.
 */
export function bancoDelArbol(opts: OpcionesDelArbol): {
  readonly medidas: string[]
  readonly deps: Pick<AutoMergeDeps, 'ficherosDelDestino' | 'medirArbolIntegrado'>
} {
  const medidas: string[] = []
  return {
    medidas,
    deps: {
      ficherosDelDestino: () => Promise.resolve(opts.destino === undefined ? [] : opts.destino),
      medirArbolIntegrado: (id) => (medidas.push(id), Promise.resolve(opts.medida ?? MEDIDA_VERDE))
    }
  }
}
