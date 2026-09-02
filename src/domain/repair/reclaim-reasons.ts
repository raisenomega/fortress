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
  /** BD -> BD: el analisis nunca termino. Al arrancar nada esta en vuelo. */
  ANALISIS_INTERRUMPIDO: 'analisis_interrumpido',
  /** BD -> git: propuesta viva sin worktree y sin merge demostrable. */
  WORKTREE_AUSENTE: 'worktree_ausente',
  /** BD -> git: el proyecto ya no esta; la ancestria no se puede consultar. */
  PROYECTO_AUSENTE: 'proyecto_ausente',
  /**
   * El operador retiro el proyecto del tablero. NO es PROYECTO_AUSENTE, y la
   * diferencia es la que este fichero existe para guardar: aquella la DESCUBRE
   * la reconciliacion al arrancar y encontrarse un proyecto que ya no esta;
   * esta la PROVOCA un acto deliberado, y se emite ANTES de soltar la fila.
   *
   * Sin ella, la cascada se llevaria las propuestas vivas en silencio y el
   * mismo hecho —este proyecto ya no esta— tendria dos destinos segun por
   * donde entrara. Mismo estado por causas distintas: colapsarlas perderia el
   * porque, que es justo lo que el estado por si solo no captura (ADR-059).
   */
  PROYECTO_RETIRADO: 'proyecto_retirado',
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
