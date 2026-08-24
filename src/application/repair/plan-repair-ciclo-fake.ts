import type { Bench, Opciones } from './plan-repair-bench-types'

/**
 * Las dos mitades que la red de la extincion mira: a quien se le cierra el ciclo
 * de vida, y con que texto se comprueba la prueba.
 *
 * El contenido por defecto es vacio: un fichero sin nada dentro no contiene
 * ningun marcador, que es el lado conservador para las pruebas que no hablan de
 * esto y no cambia lo que ya median.
 */
export function cicloDeVida(
  opts: Opciones,
  extinguidos: Bench['extinguidos'],
  mitigados: Bench['mitigados']
): Record<string, unknown> {
  return {
    findings: {
      listMemory: () => opts.findings,
      markExtinct: (ids: readonly string[], at: string, motivo: string): void =>
        void extinguidos.push({ ids, at, motivo }),
      markMitigated: (id: string, note: string, at: string): boolean => (
        mitigados.push({ id, note, at }),
        true
      )
    },
    filesystemProbe: { contenido: () => (opts.contenido === undefined ? '' : opts.contenido) }
  }
}
