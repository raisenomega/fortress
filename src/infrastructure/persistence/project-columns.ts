/**
 * Que columnas se leen de `projects` y con que forma vuelven. Las dos mitades
 * de lo mismo, y por eso viven juntas: una columna anadida al SELECT sin su
 * campo en la fila —o al reves— es un `undefined` que solo aparece en runtime.
 */
export const COLUMNS = `id, name, path, stack, git_remote, git_branch, fortress_score, general_quality,
  quality_partial, dim_seguridad, dim_correctitud, dim_tests, dim_mantenibilidad, dim_dependencias,
  dim_operacion, last_scan, has_claude, has_graph, graph_nodes, graph_edges, graph_indexed_at,
  has_fortress, trusted, loop_enabled, contaminated_at, contamination_detail, config_state,
  modulos_declarados, created_at`

/** Fila cruda de la tabla projects. SQLite no tiene boolean: usa 0/1. */
export interface ProjectRow {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly stack: string
  readonly git_remote: string | null
  readonly git_branch: string | null
  readonly fortress_score: number
  readonly general_quality: number | null
  readonly quality_partial: number | null
  readonly dim_seguridad: number | null
  readonly dim_correctitud: number | null
  readonly dim_tests: number | null
  readonly dim_mantenibilidad: number | null
  readonly dim_dependencias: number | null
  readonly dim_operacion: number | null
  readonly last_scan: string | null
  readonly has_claude: number
  readonly has_graph: number
  readonly graph_nodes: number | null
  readonly graph_edges: number | null
  readonly graph_indexed_at: string | null
  readonly has_fortress: number
  readonly trusted: number
  readonly loop_enabled: number
  readonly contaminated_at: string | null
  readonly contamination_detail: string | null
  readonly config_state: string
  /** JSON de la declaracion del operador (ADR-083), o NULL si no declaro nada. */
  readonly modulos_declarados: string | null
  readonly created_at: string
}
