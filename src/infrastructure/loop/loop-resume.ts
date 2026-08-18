import type { AppContext } from '@application/context'
import type { Progress } from '@application/loop/loop-progress'
import { spentTodayByProject } from '@application/settings/read-budget'

export interface ResumeState {
  /** spentToday base para el tope de sesion. */
  readonly baseline: number
  /** Progreso con el que arrancar, o undefined si es una sesion nueva. */
  readonly initial: Progress | undefined
}

/**
 * Estado de arranque de una sesion. Si habia una sesion viva persistida, se
 * REANUDA (mismos ciclos y scores, misma base de gasto): nada se pierde tras un
 * reinicio. Si no, empieza de cero fijando la base al gasto de hoy.
 */
export function resumeState(context: AppContext, projectId: string): ResumeState {
  const prior = context.loopSessions.get(projectId)
  if (prior?.active !== true) {
    return { baseline: spentTodayByProject(context, new Date(), projectId), initial: undefined }
  }
  return {
    baseline: prior.spentBaseline,
    initial: {
      recentScores: [...prior.recentScores],
      cyclesDone: prior.cyclesDone,
      // La racha y la cadencia arrancan frescas: ver por que en Progress.
      consecutiveDenials: 0,
      integrationsSinceScan: 0,
      consecutiveNoCandidates: 0,
      score: prior.recentScores[0] ?? null
    }
  }
}
