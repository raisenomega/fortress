import { describe, expect, it } from 'vitest'
import { actividadDe, colorDe } from './color-de-herramienta'

/** PASO 84: SOLO la palabra de la herramienta va coloreada en la actividad
 *  en vivo; el resto de la linea (args, rutas) queda en el tono normal. */
describe('el color de la palabra de la herramienta', () => {
  it.each([
    ['Glob', 'text-tool-glob'],
    ['Read', 'text-tool-read'],
    ['Grep', 'text-tool-grep'],
    ['Bash', 'text-tool-bash'],
    ['Edit', 'text-tool-write'],
    ['Write', 'text-tool-write'],
    ['Task', 'text-tool-task'],
    ['WebFetch', 'text-tool-web'],
    ['WebSearch', 'text-tool-web']
  ])('%s -> %s', (herramienta, clase) => {
    expect(colorDe(herramienta)).toBe(clase)
  })

  it('la desconocida cae al gris claro por defecto, nunca sin clase', () => {
    expect(colorDe('LS')).toBe('text-tool-otra')
  })
})

describe('la linea de actividad se parte en palabra y resto', () => {
  it('separa `· Herramienta: detalle` — la palabra sola, el resto intacto', () => {
    expect(actividadDe('· Grep: redactSecrets en src/')).toEqual({
      herramienta: 'Grep',
      resto: ': redactSecrets en src/'
    })
  })

  it('una linea normal NO es actividad: va entera en el tono normal', () => {
    expect(actividadDe('ahora reviso el guard del turno')).toBeNull()
    expect(actividadDe('')).toBeNull()
  })
})
