import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { etiquetaDelLote } from '@domain/chat/pie-del-lote'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
const BARRAS = {
  hilo: 'src/presentation/components/chat/LoteEnCurso.tsx',
  franja: 'src/presentation/components/chat/IndicadorDelLote.tsx',
  escaneo: 'src/presentation/components/scan/BarraDelLote.tsx'
}

/**
 * LA BARRA DOBLE (2026-09-20). El mismo lote se contaba de DOS maneras: el hilo
 * decia «Lote 1 de 3» —el que hago— y la franja «Lote 0 de 3» —los que termine—.
 * Las dos eran ciertas; ninguna decia a que pregunta contestaba, y juntas en
 * pantalla se leian como una contradiccion.
 *
 * El arreglo no fue esconder una barra: fue que las TRES cuenten igual. Esconder
 * dejaba `hechos` en crudo vivo en las otras dos, y la siguiente barra que
 * alguien añadiera volveria a elegir mal.
 */
describe('las tres barras del lote cuentan IGUAL', () => {
  it('las tres usan `etiquetaDelLote`, el contador del dominio', () => {
    for (const [donde, ruta] of Object.entries(BARRAS)) {
      expect(`${donde}: ${fuente(ruta)}`).toContain('etiquetaDelLote(')
    }
  })

  it('NINGUNA lee `hechos` en crudo para pintar la cuenta', () => {
    // Es la forma exacta que causaba el «0 de 3»: el campo sin traducir.
    for (const [donde, ruta] of Object.entries(BARRAS)) {
      expect(`${donde}: ${fuente(ruta)}`).not.toMatch(/hechos\}? de \{?/)
    }
  })

  it('y el contador dice CUAL SE HACE, no cuantos se terminaron', () => {
    expect(etiquetaDelLote(0, 3)).toBe('Lote 1 de 3')
    expect(etiquetaDelLote(2, 3)).toBe('Lote 3 de 3')
  })
})

describe('cada barra en su sitio, sin pisarse', () => {
  it('en AUTONOMO solo habla el hilo: la franja se calla', () => {
    expect(fuente(BARRAS.franja)).toMatch(/enCurso === null \|\| autonomo/)
  })

  it('en SUPERVISADO la franja es la unica cuenta: el pie es la pildora', () => {
    // `pieDelLote` devuelve 'ejecutando' en supervisado, y esa pildora no lleva
    // numeros. Quitar la franja alli dejaria al operador sin saber por cual va.
    expect(fuente('src/domain/chat/pie-del-lote.ts')).toMatch(/e\.autonomo \? 'lote-en-curso' : 'ejecutando'/) // prettier-ignore
    // Y el hilo no decide el modo por su cuenta: se lo da `pieDelLote`. Dos
    // sitios mirando el ajuste es la forma de que un dia discrepen.
    expect(fuente(BARRAS.hilo)).not.toMatch(/useSettingsStore/)
  })
})

describe('el control de Detener no se toca', () => {
  it('el freno real es el boton rojo, no el texto de la franja', () => {
    // La franja solo NOMBRA el Detener; quien lo ejecuta es `SendButton`.
    expect(fuente(BARRAS.franja)).not.toMatch(/onClick|stopWorkflow|<button/)
    expect(fuente('src/presentation/components/chat/SendButton.tsx')).toContain('Detener')
    expect(fuente('src/presentation/components/chat/ChatWindow.tsx')).toMatch(
      /onStop=\{\(\) => project && void stopWorkflow\(project\.id\)\}/
    )
  })
})
