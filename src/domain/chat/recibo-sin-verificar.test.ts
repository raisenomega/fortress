import { describe, expect, it } from 'vitest'
import { notaDelCierre } from './cierre-del-ciclo'
import { resumenDelLote } from './parte-del-lote'

/**
 * ADR-091 §4, el recibo. Un turno puede quedarse escrito sin que nadie haya
 * compilado el proyecto. Si eso llega mudo, el operador ve «arreglado» y lo lee
 * como «arreglado y compila» — la misma distancia que separa un producto de
 * seguridad de uno que solo lo parece.
 *
 * El recibo va a los TRES sitios donde el operador mira: el aviso del turno
 * (probado en `conservado-sin-verificar.test.ts`), la fila del hallazgo —que es
 * lo que la UI pinta— y el parte del lote.
 */
describe('la fila del hallazgo dice si nadie lo compilo', () => {
  it('con DESCONOCIDA lo grita, y en la nota que la UI ya pinta', () => {
    const nota = notaDelCierre('m1', ['/p/vercel.json'], '/p', 'desconocida')

    expect(nota).toContain('SIN VERIFICAR')
    expect(nota).toContain('no habia con que compilar')
    // Sin perder lo que ya decia: que turno fue y que ficheros toco.
    expect(nota).toContain('turno m1')
    expect(nota).toContain('vercel.json')
  })

  it('con VERDE no añade ruido: no hay nada que avisar', () => {
    expect(notaDelCierre('m1', ['/p/a.ts'], '/p', 'verde')).not.toContain('SIN VERIFICAR')
  })

  it('y por defecto calla: quien no pasa el dato no dispara el aviso', () => {
    expect(notaDelCierre('m1', ['/p/a.ts'], '/p')).not.toContain('SIN VERIFICAR')
  })
})

describe('el parte del lote lo cuenta, no lo esconde', () => {
  const tres = ['extinguido', 'extinguido', 'extinguido'] as const

  it('dice cuantos se quedaron sin comprobar', () => {
    const parte = resumenDelLote(tres, 3, [], 2)

    expect(parte).toContain('OJO: 2')
    expect(parte).toContain('SIN comprobar que el proyecto compila')
    expect(parte).toContain('Revisalos tu')
  })

  it('en singular tambien se lee bien', () => {
    expect(resumenDelLote(tres, 3, [], 1)).toContain('1 se quedo escrito SIN comprobar')
  })

  it('si todos se compilaron, el parte no lo menciona', () => {
    expect(resumenDelLote(tres, 3, [], 0)).not.toContain('OJO')
  })

  it('sin el dato se comporta como antes: el parte no cambia', () => {
    expect(resumenDelLote(tres, 3)).toBe(resumenDelLote(tres, 3, [], 0))
  })

  it('el aviso habla de compilar, no de rc ni de scripts rotos', () => {
    // Lo lee el operador, no un ingeniero de guardia.
    expect(resumenDelLote(tres, 3, [], 1)).not.toMatch(/127|rc=|exit|stderr|ENOENT/)
  })
})
