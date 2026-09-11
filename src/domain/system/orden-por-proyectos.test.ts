import { describe, expect, it } from 'vitest'
import type { SelfObservation } from './self-observation'
import { ordenarObservaciones } from './observation-order'

const obs = (id: string, area: string, kind = 'gap'): SelfObservation =>
  ({ id, area, kind, sourceProject: 'p', note: 'n', status: 'pendiente', reason: null,
     attendedBy: null, attendedAt: null, createdAt: '2026-09-01' }) as SelfObservation

describe('el orden premia los PROYECTOS, no las repeticiones', () => {
  it('vista en 3 proyectos gana a vista 30 veces en 1', () => {
    // El caso que el orden viejo tenia al reves. Treinta filas del mismo `area`
    // en UN proyecto subian por frecuencia; una vista en tres clientes se
    // hundia. La segunda dice «esto le falta a FORTRESS en todos los stacks»;
    // la primera solo dice que un escaneo tiene doce paradas.
    const treintaEnUno = Array.from({ length: 30 }, (_, i) => obs(`r${i}`, 'consulta-del-grafo'))
    const enTresClientes = obs('senal', 'cognicion')

    const orden = ordenarObservaciones([...treintaEnUno, enTresClientes], (id) =>
      id === 'senal' ? 3 : 1
    )

    expect(orden[0].id).toBe('senal')
    expect(orden[0].vistaEn).toBe(3)
  })

  it('a igual vistaEn manda la frecuencia del area, que ahora agrupa de verdad', () => {
    const tres = ['a', 'b', 'c'].map((s) => obs(s, 'permisos-de-herramienta'))
    const sola = obs('sola', 'cognicion')

    const orden = ordenarObservaciones([sola, ...tres], () => 2)

    expect(orden[0].area).toBe('permisos-de-herramienta')
  })

  it('y a igual frecuencia manda la urgencia del kind: un bug antes que una idea', () => {
    const idea = obs('idea', 'cognicion', 'oportunidad')
    const roto = obs('roto', 'otro', 'bug')

    expect(ordenarObservaciones([idea, roto], () => 1)[0].id).toBe('roto')
  })

  it('sin quien cuente los proyectos no revienta: todas a cero y manda el resto', () => {
    const orden = ordenarObservaciones([obs('a', 'otro'), obs('b', 'otro')])

    expect(orden).toHaveLength(2)
    expect(orden[0].vistaEn).toBe(0)
  })
})
