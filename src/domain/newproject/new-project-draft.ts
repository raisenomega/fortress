export const PROJECT_KINDS = ['saas', 'api', 'landing', 'mobile', 'cli'] as const

export type ProjectKind = (typeof PROJECT_KINDS)[number]

export const KIND_LABEL: Record<ProjectKind, string> = {
  saas: 'SaaS',
  api: 'API',
  landing: 'Landing',
  mobile: 'Mobile',
  cli: 'CLI'
}

export interface NewProjectDraft {
  readonly name: string
  /** Que hace, en una o dos frases. */
  readonly purpose: string
  /** Stack elegido, o vacio para que FORTRESS recomiende uno. */
  readonly stack: string
  readonly kind: ProjectKind
  readonly hasAi: boolean
  readonly hasPayments: boolean
  readonly multiTenant: boolean
  /** Carpeta donde se creara la del proyecto. */
  readonly parentDir: string
}

export const EMPTY_DRAFT: NewProjectDraft = {
  name: '',
  purpose: '',
  stack: '',
  kind: 'saas',
  hasAi: false,
  hasPayments: false,
  multiTenant: false,
  parentDir: ''
}

/**
 * Areas sensibles declaradas por el operador. Deciden que reglas entran en el
 * CLAUDE.md del proyecto: un proyecto con pagos necesita reglas que uno sin
 * pagos no, y meterlas todas siempre convierte el documento en ruido.
 */
export function sensitiveAreas(draft: NewProjectDraft): readonly string[] {
  const areas: string[] = []
  if (draft.hasAi) areas.push('IA')
  if (draft.hasPayments) areas.push('pagos')
  if (draft.multiTenant) areas.push('multi-tenant')
  return areas
}
