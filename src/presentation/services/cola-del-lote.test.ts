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

  it('cada peticion lleva su foco, va en EDICION y arrastra el lote de contexto', async () => {
    const b = banco()
    await correrLote('p1', IDS, b.p)
    // Edicion aunque el operador este en supervisado: lo autorizo al aprobar el plan.
    expect(b.enviados.map((i) => `${i.projectId}/${i.findingId}/${i.mode}`)).toEqual([
      'p1/f1/autonomo',
      'p1/f2/autonomo',
      'p1/f3/autonomo'
    ])
    expect(b.enviados.map((i) => i.lote)).toEqual([IDS, IDS, IDS])
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

  it('la cola YA NO mira el modo: corre igual, y el juicio lo pone cada turno', async () => {
    // ADR-090, Fase A.1c. El candado de autonomo se fue con su puerto: `modo`
    // ya no existe en `PuertosDeLaCola`, asi que no hay nada que consultar.
    const b = banco({})
    await correrLote('p1', IDS, b.p)

    expect(b.enviados.map((i) => i.findingId)).toEqual(IDS)
    expect(Object.keys(b.p)).not.toContain('modo')
  })

  it('con otro lote o un turno en marcha, no arranca', async () => {
    const b = banco({ ocupada: true })
    expect(await correrLote('p1', IDS, b.p)).toBeNull()
    expect(b.enviados).toEqual([])
  })
})
