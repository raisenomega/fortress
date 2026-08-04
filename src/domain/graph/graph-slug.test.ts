import { describe, expect, it } from 'vitest'
import { graphSlug } from './graph-slug'

describe('graphSlug', () => {
  it('convierte la ruta absoluta al slug del .db del grafo', () => {
    expect(graphSlug('/home/jojo/Escritorio/Raisen_FCC/fortress-command-center')).toBe(
      'home-jojo-Escritorio-Raisen_FCC-fortress-command-center'
    )
  })

  it('conserva los guiones bajos y quita la barra inicial', () => {
    expect(graphSlug('/a/b_c/d')).toBe('a-b_c-d')
  })
})
