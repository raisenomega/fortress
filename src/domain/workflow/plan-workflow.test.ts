import { describe, expect, it } from 'vitest'
import { planWorkflow } from './plan-workflow'
import { routeWorkflow } from './route-workflow'
import { findWorkflow } from './workflow-catalog'

const seguridad = findWorkflow('seguridad')

describe('planWorkflow', () => {
  it('sin exclusiones corren todos los pasos', () => {
    const plan = planWorkflow(seguridad, [])
    expect(plan.active).toHaveLength(3)
    expect(plan.warnings).toEqual([])
  })

  it('un agente apagado se excluye y se avisa por su nombre', () => {
    // Callarselo daria un informe de seguridad sin la parte de seguridad.
    const plan = planWorkflow(seguridad, ['security-reviewer'])
    expect(plan.active.map((step) => step.agentId)).toEqual(['code-reviewer', 'cognition'])
    expect(plan.warnings).toEqual([
      'Security Reviewer esta desactivado. Su parte del workflow no se ejecutara.'
    ])
  })

  it('el paso excluido sigue en el plan, marcado', () => {
    // El operador tiene que ver lo que NO se va a hacer, no solo lo que si.
    const plan = planWorkflow(seguridad, ['security-reviewer'])
    expect(plan.steps).toHaveLength(3)
    expect(plan.steps[0].excluded).toBe(true)
  })

  it('excluirlo todo deja un plan vacio, no un plan falso', () => {
    const plan = planWorkflow(seguridad, ['security-reviewer', 'code-reviewer', 'cognition'])
    expect(plan.active).toEqual([])
    expect(plan.warnings).toHaveLength(3)
  })

  it('solo seguridad lleva puerta: es la que puede detener el workflow', () => {
    const plan = planWorkflow(routeWorkflow('esta listo para produccion?'), [])
    const conPuerta = plan.active.filter((step) => step.gate === true)
    expect(conPuerta.map((step) => step.agentId)).toEqual(['security-reviewer'])
  })
})
