import { describe, expect, it } from 'vitest'
import { leerVivasDeHoy, leerZombis } from './filas-con-identidad-vieja'
import { baseCon, PROYECTO, VIEJA } from './red-de-la-fusion-fixture'

/**
 * EL SELECTOR DEL BACKFILL, derivado de la FORMA de la clave y no del tipo.
 * `tipo = 'otro'` se llevaria por delante las filas que el escaner de hoy
 * clasifico `otro` legitimamente —5 en mailbd, medido—, que no son zombis: son
 * hallazgos sanos con identidad ADR-084. Aqui se fija que no las alcance.
 */
const base = (): ReturnType<typeof baseCon> =>
  baseCon([
    { id: 'zombi', identity: VIEJA, tipo: 'otro' },
    { id: 'zombi-extinta', identity: VIEJA, tipo: 'otro', lifecycle: 'EXTINCT' },
    { id: 'otro-legitimo', identity: 'f.ts|1|otro', tipo: 'otro' },
    { id: 'sana', identity: 'f.ts|2|path-traversal', tipo: 'path-traversal' }
  ])

describe('leerZombis: solo las vivas con la clave de antes de ADR-067', () => {
  it('coge la zombi y NADA mas: ni la extinta, ni la sana, ni el otro legitimo', () => {
    expect(leerZombis(base(), PROYECTO).map((f) => f.id)).toEqual(['zombi'])
  })

  it('trae lo que el backfill necesita: fichero, linea, titulo, severidad, clave y fecha', () => {
    const [z] = leerZombis(base(), PROYECTO)
    expect(z).toMatchObject({
      file: 'f.ts',
      line: 1,
      title: 't',
      severity: 'MEDIUM',
      identity: VIEJA
    })
    expect(typeof z.first_seen).toBe('string')
  })
})

describe('leerVivasDeHoy: entre ellas viven las gemelas', () => {
  it('son las vivas con clave ADR-084, incluido el otro legitimo; nunca una zombi', () => {
    expect(
      leerVivasDeHoy(base(), PROYECTO)
        .map((f) => f.id)
        .sort()
    ).toEqual(['otro-legitimo', 'sana'])
  })
})
