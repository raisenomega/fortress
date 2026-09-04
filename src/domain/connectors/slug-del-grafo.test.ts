import { describe, expect, it } from 'vitest'
import { slugDelGrafo } from './slug-del-grafo'

describe('como se llama el proyecto dentro del grafo', () => {
  it('la ruta aplanada, sin barra inicial: el caso real medido', () => {
    // Verificado contra list_projects del servidor vivo, no supuesto.
    expect(slugDelGrafo('/home/jojo/Escritorio/Raisen_FCC/fortress-command-center')).toBe(
      'home-jojo-Escritorio-Raisen_FCC-fortress-command-center'
    )
  })

  it('conserva mayusculas y guiones bajos: no normaliza el nombre', () => {
    expect(slugDelGrafo('/home/jojo/Escritorio/mailbd-main')).toBe('home-jojo-Escritorio-mailbd-main') // prettier-ignore
  })

  it('una barra final no deja el guion colgando', () => {
    expect(slugDelGrafo('/a/b/')).toBe('a-b')
  })
})
