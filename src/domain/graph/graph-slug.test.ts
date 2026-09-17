import { describe, expect, it } from 'vitest'
import { graphSlug } from './graph-slug'

/**
 * Los PARES REALES medidos en la cache de codebase-memory-mcp v0.9.0. No son
 * supuestos: cada `.db` guarda su `root_path`, asi que es el propio servidor
 * diciendo con que ruta nombro cada fichero. Si el servidor cambia su regla,
 * este fixture se vuelve a medir; no se adivina.
 */
const REALES: ReadonlyArray<readonly [string, string]> = [
  [
    '/home/jojo/Escritorio/Raisen_FCC/fortress-command-center',
    'home-jojo-Escritorio-Raisen_FCC-fortress-command-center'
  ],
  ['/media/jojo/Jorge_Ibrain/APT BY', 'media-jojo-Jorge_Ibrain-APT-BY'],
  [
    '/media/jojo/Jorge_Ibrain/Health Flow V1_FINAL',
    'media-jojo-Jorge_Ibrain-Health-Flow-V1_FINAL'
  ],
  ['/media/jojo/Jorge_Ibrain/Raisen Omega', 'media-jojo-Jorge_Ibrain-Raisen-Omega'],
  ['/media/jojo/onn Disk/raisen-nucleo', 'media-jojo-onn-Disk-raisen-nucleo']
]

describe('el slug nombra el .db igual que el servidor', () => {
  it.each(REALES)('%s', (ruta, esperado) => {
    expect(graphSlug(ruta)).toBe(esperado)
  })

  it('los ESPACIOS eran lo que faltaba: cuatro de cinco grafos no se encontraban', () => {
    // El unico que funcionaba era el que no tiene espacios en su ruta, que es
    // justo con el que se habia «verificado» la regla.
    const conEspacio = REALES.filter(([ruta]) => ruta.includes(' '))

    expect(conEspacio).toHaveLength(4)
    for (const [ruta, esperado] of conEspacio) expect(graphSlug(ruta)).toBe(esperado)
  })

  it('el guion bajo se CONSERVA: no es un separador', () => {
    expect(graphSlug('/a/Raisen_FCC/b')).toBe('a-Raisen_FCC-b')
  })

  it('y las mayusculas tambien: el nombre no se pone en minusculas', () => {
    expect(graphSlug('/media/APT BY')).toBe('media-APT-BY')
  })
})
