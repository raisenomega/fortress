import { isConfigState } from '@domain/project/config-state'
import { normalizeScore } from '@domain/project/fortress-score'
import type { Project } from '@domain/project/project'
import { aDeclaracion } from '@domain/scan/declaracion-de-modulos'
import type { DimensionScores } from '@domain/score/dimension'
import type { ProjectRow } from './project-columns'

function toDimensions(row: ProjectRow): DimensionScores | null {
  if (row.general_quality === null) return null
  return {
    seguridad: row.dim_seguridad,
    correctitud: row.dim_correctitud,
    tests: row.dim_tests,
    mantenibilidad: row.dim_mantenibilidad,
    dependencias: row.dim_dependencias,
    operacion: row.dim_operacion
  }
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    stack: row.stack,
    gitRemote: row.git_remote,
    gitBranch: row.git_branch,
    fortressScore: normalizeScore(row.fortress_score),
    generalQuality: row.general_quality === null ? null : normalizeScore(row.general_quality),
    qualityDimensions: toDimensions(row),
    qualityPartial: row.quality_partial === 1,
    lastScan: row.last_scan,
    hasClaude: row.has_claude === 1,
    hasGraph: row.has_graph === 1,
    graphNodes: row.graph_nodes,
    graphEdges: row.graph_edges,
    graphIndexedAt: row.graph_indexed_at,
    hasFortress: row.has_fortress === 1,
    trusted: row.trusted === 1,
    loopEnabled: row.loop_enabled === 1,
    contaminated: row.contaminated_at !== null,
    contaminationDetail: row.contamination_detail,
    configState: isConfigState(row.config_state) ? row.config_state : 'CONFIGURADO',
    modulosDeclarados: aDeclaracion(row.modulos_declarados),
    createdAt: row.created_at
  }
}
