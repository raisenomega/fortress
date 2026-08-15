/**
 * Por que una propuesta viva acabo donde acabo cuando la reconciliacion de
 * arranque la tocó. El ESTADO dice que paso; la RAZON dice por que, y son
 * diagnosticos distintos: un worktree que falta y un proyecto que ya no existe
 * llevan al mismo estado por caminos que no se parecen en nada. Colapsarlas
 * perderia informacion que el estado por si solo no captura (ADR-059).
 */
export const RECLAIM_REASONS = {
  /** Disco -> BD: habia worktree de una propuesta a medio analizar. */
  ORPHAN_BEFORE_GENERATE: 'orphan_before_generate',
  /** BD -> git: propuesta viva sin worktree y sin merge demostrable. */
  WORKTREE_AUSENTE: 'worktree_ausente',
  /** BD -> git: el proyecto ya no esta; la ancestria no se puede consultar. */
  PROYECTO_AUSENTE: 'proyecto_ausente',
  /** BD -> git: el commit del fix ya vive en HEAD. Lo firmo un humano. */
  MERGE_DETECTADO: 'merge_detectado_en_git',
  /**
   * Su libro se reconstruyo a mano (backfill) y no guarda el analisis: C3 no
   * puede generar sin el entendimiento de C2, y fabricarlo seria inventarle la
   * entrada. La propuesta no puede avanzar por mas veces que se pulse; el
   * hallazgo vuelve a la baraja para intentarlo con una cadena completa.
   *
   * Es de otra familia que las cuatro de arriba: no la descubre la
   * reconciliacion mirando el disco, sino el propio guard al ir a generar.
   */
  CADENA_SINTETICA: 'cadena_sintetica'
} as const
