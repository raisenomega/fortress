import { CLOSING_STEP, type Workflow, type WorkflowId } from './workflow'

const SECURITY = {
  agentId: 'security-reviewer',
  task: 'Ejecuta la FASE 1 de seguridad: secrets, inyecciones, auth, CORS, headers y rate limiting.',
  gate: true
} as const

const QUALITY = {
  agentId: 'code-reviewer',
  task: 'Revisa la calidad: errores no manejados, promesas sin await, null sin comprobar y comparaciones incorrectas.'
} as const

const CLEANER = {
  agentId: 'refactor-cleaner',
  task: 'Identifica codigo muerto, imports sin usar, duplicados y restos de depuracion.'
} as const

const TDD = {
  agentId: 'tdd-guide',
  task: 'Revisa la cobertura de tests y senala que comportamiento critico se queda sin probar.'
} as const

const CATALOG: Readonly<Record<Exclude<WorkflowId, 'libre'>, Workflow>> = {
  seguridad: {
    id: 'seguridad',
    label: 'Revision de seguridad',
    steps: [SECURITY, QUALITY, CLOSING_STEP]
  },
  limpieza: {
    id: 'limpieza',
    label: 'Limpieza de codigo',
    steps: [CLEANER, QUALITY, TDD, CLOSING_STEP]
  },
  bugs: { id: 'bugs', label: 'Busqueda de bugs', steps: [QUALITY, SECURITY, TDD, CLOSING_STEP] },
  tests: { id: 'tests', label: 'Cobertura de tests', steps: [TDD, QUALITY, CLOSING_STEP] },
  produccion: {
    id: 'produccion',
    label: 'Listo para produccion',
    steps: [
      {
        agentId: 'planner',
        task: 'Analiza el estado general del proyecto y que falta para poder desplegarlo.'
      },
      SECURITY,
      QUALITY,
      CLEANER,
      TDD,
      {
        agentId: 'e2e-runner',
        task: 'Verifica los flujos completos de punta a punta y senala los que no estan cubiertos.'
      },
      CLOSING_STEP
    ]
  }
}

export function findWorkflow(id: Exclude<WorkflowId, 'libre'>): Workflow {
  return CATALOG[id]
}

export const WORKFLOWS: readonly Workflow[] = Object.values(CATALOG)
