import { describe, expect, it } from 'vitest'
import { buildEpisodePrompt, parseEpisode } from './episode-prompt'

describe('buildEpisodePrompt', () => {
  it('nombra la capacidad y pide el bloque EPISODE', () => {
    const prompt = buildEpisodePrompt('Redactor', 'analiza')
    expect(prompt).toContain('Redactor')
    expect(prompt).toContain('EPISODE:')
  })
})

describe('parseEpisode', () => {
  it('extrae outcome y summary', () => {
    expect(parseEpisode('bla\nEPISODE: {"outcome":"ok","summary":"resolvio X"}')).toEqual({
      outcome: 'ok',
      summary: 'resolvio X'
    })
  })

  it('un outcome invalido se descarta', () => {
    expect(parseEpisode('EPISODE: {"outcome":"quiza","summary":"x"}')).toBeNull()
  })

  it('sin bloque o roto devuelve null', () => {
    expect(parseEpisode('nada')).toBeNull()
    expect(parseEpisode('EPISODE: {roto')).toBeNull()
  })
})
