import { describe, expect, it } from 'vitest'
import { selectTarget, type Candidate } from './select-target'

const NUEVO = '2026-08-19T00:00:00.000Z'

/** No aditivo (surface 11): el 86% del pozo real esta ahi. */
const c = (id: string, file: string): Candidate => ({ id, severity: 'LOW', title: 'permite reenviar correos', file, line: 1, firstSeen: NUEVO, tipo: 'path-traversal', simbolo: 'handleverify' }) // prettier-ignore

/** El pozo real en pequeno: un dotfile denso, dos carpetas de letra baja, una
 *  carpeta de letra alta con el grueso, y las tres migraciones que hoy no se
 *  auditan nunca. Mismas proporciones que mailbd. */
function pozo(): Candidate[] {
  const lista: Candidate[] = []
  for (let i = 0; i < 9; i++) lista.push(c(`env-${i}`, '.env'))
  for (let i = 0; i < 3; i++) lista.push(c(`pub-${i}`, 'public/_headers'))
  for (let i = 0; i < 4; i++) lista.push(c(`src-${i}`, 'src/lib/sanitize.ts'))
  for (let i = 0; i < 30; i++) lista.push(c(`fun-${i}`, 'supabase/functions/a/index.ts'))
  for (let i = 0; i < 3; i++) lista.push(c(`mig-${i}`, 'supabase/migrations/x.sql'))
  return lista
}

/**
 * CONSUMO, no orden estatico. El motor elige UNO por ciclo y el elegido sale
 * del pozo; medir la lista ordenada de una vez dice otra cosa —y fue la premisa
 * falsa que hizo firmar un reparto por turnos que resulto ser el alfabeto.
 */
function secuencia(lista: readonly Candidate[]): string[] {
  const quedan = [...lista]
  const salida: string[] = []
  while (quedan.length > 0) {
    const elegido = selectTarget(quedan)
    if (elegido === null) break
    salida.push(elegido.target.id)
    quedan.splice(
      quedan.findIndex((x) => x.id === elegido.target.id),
      1
    )
  }
  return salida
}

describe('el selector reparte en vez de premiar al alfabeto', () => {
  it('ciclo a ciclo, una migracion de supabase sale en el primer tercio', () => {
    const lista = pozo()
    const ciclo = secuencia(lista).findIndex((id) => id.startsWith('mig-')) + 1
    expect(ciclo).toBeGreaterThan(0)
    expect(ciclo).toBeLessThanOrEqual(Math.ceil(lista.length / 3))
  })

  it('el dotfile denso deja de acaparar: no salen nueve .env seguidos', () => {
    const primeros = secuencia(pozo()).slice(0, 9)
    expect(primeros.filter((id) => id.startsWith('env-')).length).toBeLessThan(9)
    expect(new Set(primeros.map((id) => id.split('-')[0])).size).toBeGreaterThan(1)
  })

  it('determinista: el mismo pozo da la misma secuencia entera dos veces', () => {
    expect(secuencia(pozo())).toEqual(secuencia(pozo()))
  })

  it('puro: barajar la entrada no cambia la secuencia', () => {
    expect(secuencia([...pozo()].reverse())).toEqual(secuencia(pozo()))
  })
})
