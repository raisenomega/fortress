import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { abrirCheckpoint } from './checkpoint-transitorio'
import { leerTrabajo } from './trabajo-del-turno'
import { crearRepo, escribir, limpiar } from './checkpoint-fixture'

const dirs: string[] = []
afterEach(() => limpiar(dirs))

/** La MISMA huella que calcula `juez-del-turno.ts:57` sobre un intento. */
function huellaDeUnIntento(contenido: string): string {
  const dir = crearRepo()
  dirs.push(dir)
  const cp = abrirCheckpoint(dir)
  escribir(dir, 'fix.ts', contenido)
  const { diffText = '' } = leerTrabajo(dir, cp?.sha ?? '') ?? {}
  return createHash('sha1').update(diffText).digest('hex')
}

/**
 * ADR-093 §4.4, enmienda. La huella decide si el productor AVANZA
 * (`ciclo-de-convergencia.ts:60-61`) y sale de `diffText`. Como `git diff` no
 * veia los untracked, dos intentos que solo cambiaban un fichero NUEVO daban la
 * misma huella: el ciclo los tomaba por vueltas en redondo y cerraba sin
 * resolver un turno que si habia avanzado.
 *
 * Por eso al `diffText` va el CONTENIDO del fichero creado y no solo su nombre:
 * con el nombre a secas, estos dos casos serian indistinguibles otra vez.
 */
describe('la huella de convergencia ve los ficheros creados', () => {
  it('mismo fichero nuevo, CONTENIDO DISTINTO: huellas distintas', () => {
    // El productor avanzo. Si esto fallara, el ciclo lo mandaria a casa por vago.
    const primera = huellaDeUnIntento('export const intento = 1\n')
    const segunda = huellaDeUnIntento('export const intento = 2\n')

    expect(primera).not.toBe(segunda)
  })

  it('mismo fichero nuevo, MISMO contenido: huella identica', () => {
    // Dando vueltas de verdad. La convergencia tiene que seguir cortando aqui:
    // si esto cambiara, el ciclo no pararia nunca y no seria convergencia.
    expect(huellaDeUnIntento('export const igual = 1\n')).toBe(
      huellaDeUnIntento('export const igual = 1\n')
    )
  })
})
