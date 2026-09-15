import { describe, expect, it } from 'vitest'
import { correrLote } from './cola-del-lote'
import { banco } from './cola-del-lote-fixture'

const IDS = ['f1', 'f2', 'f3']

describe('la cola del lote: un turno con foco por hallazgo, en orden', () => {
  it('manda uno a uno, esperando cada promesa y recargando entre turnos', async () => {
    const b = banco()
    await correrLote('p1', IDS, b.p)
    expect(b.log.join(' ')).toBe(
      'arrancar enviar:f1 fin:f1 recargar enviar:f2 fin:f2 recargar enviar:f3 fin:f3 recargar terminar'
    )
  })

  it('cada peticion lleva su findingId, en autonomo, con el borrador de su fila', async () => {
    const b = banco()
    await correrLote('p1', IDS, b.p)
    expect(b.enviados.map((i) => `${i.projectId}/${i.findingId}/${i.mode}`)).toEqual([
      'p1/f1/autonomo',
      'p1/f2/autonomo',
      'p1/f3/autonomo'
    ])
    expect(b.enviados[0].prompt).toContain('t-f1')
  })

  it('un turno que no cierra NO detiene la cola: siguen los demas', async () => {
    const b = banco()
    expect(await correrLote('p1', IDS, b.p)).toEqual(['no_cerro', 'no_cerro', 'no_cerro'])
    expect(b.enviados).toHaveLength(3)
  })
})

describe('lo que corta la cola, y lo que no la deja arrancar', () => {
  it('Detener corta la cola entera: no se lanza el siguiente', async () => {
    const b = banco({ detenerTras: 1 })
    await correrLote('p1', IDS, b.p)
    expect(b.enviados.map((i) => i.findingId)).toEqual(['f1'])
    expect(b.resumenes[0]).toContain('Cortado: 2 sin lanzar.')
  })

  it('salir de autonomo a mitad tambien la corta', async () => {
    const b = banco({ modo: (n) => (n <= 1 ? 'autonomo' : 'supervisado') })
    await correrLote('p1', IDS, b.p)
    expect(b.enviados.map((i) => i.findingId)).toEqual(['f1'])
  })

  it('en supervisado no arranca: ni envia ni cuenta', async () => {
    const b = banco({ modo: () => 'supervisado' })
    expect(await correrLote('p1', IDS, b.p)).toBeNull()
    expect([b.enviados, b.resumenes]).toEqual([[], []])
  })

  it('con otro lote o un turno en marcha, no arranca', async () => {
    const b = banco({ ocupada: true })
    expect(await correrLote('p1', IDS, b.p)).toBeNull()
    expect(b.enviados).toEqual([])
  })
})
