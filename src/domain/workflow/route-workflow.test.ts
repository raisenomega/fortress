import { describe, expect, it } from 'vitest'
import { routeWorkflow } from './route-workflow'

const agents = (prompt: string): string[] => routeWorkflow(prompt).steps.map((step) => step.agentId)

describe('routeWorkflow con los botones de atajo', () => {
  it('seguridad encadena escaneo, calidad y cognition', () => {
    expect(agents('Revisa la seguridad de este proyecto')).toEqual([
      'security-reviewer',
      'code-reviewer',
      'cognition'
    ])
  })

  it('limpieza pasa por calidad y tests antes de cerrar', () => {
    expect(agents('Limpia el codigo de este proyecto')).toEqual([
      'refactor-cleaner',
      'code-reviewer',
      'tdd-guide',
      'cognition'
    ])
  })

  it('produccion convoca a los seis mas cognition', () => {
    expect(agents('Esta listo para produccion?')).toEqual([
      'planner',
      'security-reviewer',
      'code-reviewer',
      'refactor-cleaner',
      'tdd-guide',
      'e2e-runner',
      'cognition'
    ])
  })

  it('produccion gana sobre seguridad aunque el texto mencione ambas', () => {
    // "listo para produccion" es un veredicto completo, no un scan suelto.
    expect(routeWorkflow('esta listo para produccion en seguridad?').id).toBe('produccion')
  })
})

describe('routeWorkflow con mensaje libre', () => {
  it('arma el workflow con los temas que menciona el mensaje', () => {
    expect(agents('revisa la auth y de paso simplifica la complejidad')).toEqual([
      'security-reviewer',
      'code-simplifier',
      'cognition'
    ])
  })

  it('sin tema reconocible revisa calidad, nunca se queda sin hacer nada', () => {
    expect(agents('echale un ojo a esto')).toEqual(['code-reviewer', 'cognition'])
  })

  it('cognition cierra siempre, sea cual sea el mensaje', () => {
    for (const prompt of ['hola', 'compila mal', 'escribe tests', 'publicar']) {
      expect(agents(prompt).at(-1)).toBe('cognition')
    }
  })

  it('no repite un agente aunque el mensaje insista', () => {
    const lista = agents('seguridad seguridad auth secret')
    expect(new Set(lista).size).toBe(lista.length)
  })
})
