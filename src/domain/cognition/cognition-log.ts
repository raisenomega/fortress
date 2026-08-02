import type { Severity } from '../shared/severity'

export const PATTERN_STATUSES = ['ACTIVE', 'MITIGATED', 'EXTINTO'] as const

export type PatternStatus = (typeof PATTERN_STATUSES)[number]

export function isPatternStatus(value: unknown): value is PatternStatus {
  return typeof value === 'string' && (PATTERN_STATUSES as readonly string[]).includes(value)
}

export interface CognitionPattern {
  /** PTN-2026-001. */
  readonly id: string
  readonly title: string
  readonly status: PatternStatus
  readonly severity: Severity | null
  readonly detectedAt: string | null
  readonly recurrences: number | null
}

export interface AttentionZone {
  readonly zone: string
  /** Peso 0.0-1.0 declarado en el log. */
  readonly weight: number
  readonly reason: string
}

export interface CognitionReflection {
  readonly session: string
  readonly project: string
  readonly body: string
}

export interface CognitionSnapshot {
  /** Falso si el proyecto no tiene COGNITION-LOG.md. */
  readonly present: boolean
  readonly generation: number | null
  readonly patterns: readonly CognitionPattern[]
  readonly attention: readonly AttentionZone[]
  readonly reflections: readonly CognitionReflection[]
}

export const EMPTY_SNAPSHOT: CognitionSnapshot = {
  present: false,
  generation: null,
  patterns: [],
  attention: [],
  reflections: []
}
