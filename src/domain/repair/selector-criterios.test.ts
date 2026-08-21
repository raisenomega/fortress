import { describe, expect, it } from 'vitest'
import { selectTarget, type Candidate } from './select-target'
import { cargaPorDirectorio, directorio } from './orden-candidatos'

const VIEJO = '2026-08-04T00:00:00.000Z'
const NUEVO = '2026-08-19T00:00:00.000Z'

/** No aditivo (surface 11): el 86% del pozo real esta ahi. */
const c = (id: string, file: string, firstSeen = NUEVO, title = 'permite reenviar correos'): Candidate => ({ id, severity: 'LOW', title, file, line: 1, firstSeen }) // prettier-ignore

describe('los criterios de desempate del selector, uno a uno', () => {
  it('quien espera sube: a igual superficie, el mas viejo primero', () => {
    const elegido = selectTarget([c('nuevo', 'a/a.ts', NUEVO), c('viejo', 'z/z.ts', VIEJO)])
    expect(elegido?.target.id).toBe('viejo')
  })

  it('la antiguedad manda sobre la cola: la carpeta cargada gana si es mas vieja', () => {
    const lista = [c('solo', 'z/solo.ts', NUEVO), c('viejo-1', 'a/x.ts', VIEJO), c('viejo-2', 'a/y.ts', VIEJO)] // prettier-ignore
    expect(selectTarget(lista)?.target.id).toBe('viejo-1')
  })

  it('a igual antiguedad, sale el de la carpeta con menos pendientes', () => {
    const lista = [c('denso-1', 'muchos/a.ts'), c('denso-2', 'muchos/b.ts'), c('raro', 'pocos/z.ts')] // prettier-ignore
    expect(selectTarget(lista)?.target.id).toBe('raro')
  })

  it('no-regresion: la superficie manda sobre todo lo demas', () => {
    const aditivoNuevo = c('aditivo', 'z/z.ts', NUEVO, 'falta la guarda')
    const pesadoViejo = c('pesado', 'a/a.ts', VIEJO)
    expect(selectTarget([pesadoViejo, aditivoNuevo])?.target.id).toBe('aditivo')
  })

  it('la carga se cuenta por DIRECTORIO completo, no por raiz ni por fichero', () => {
    expect(directorio('supabase/migrations/x.sql')).toBe('supabase/migrations')
    expect(directorio('.env')).toBe('.')
    const carga = cargaPorDirectorio([c('a', 'd/a.ts'), c('b', 'd/b.ts'), c('z', 'otro/z.ts')])
    expect(carga.get('d')).toBe(2)
    expect(carga.get('otro')).toBe(1)
  })
})
