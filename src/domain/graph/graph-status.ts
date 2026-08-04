export type GraphState = 'no-instalado' | 'configurado'

/** Datos reales del indice del grafo (SQLite de codebase-memory-mcp). */
export interface GraphStats {
  readonly nodes: number
  readonly edges: number
  readonly files: number
  /** ISO de la ultima indexacion, o null si el indice no lo trae. */
  readonly indexedAt: string | null
  readonly rootPath: string | null
}

export interface GraphStatus {
  readonly state: GraphState
  /** Nombre del servidor MCP detectado, si lo hay. */
  readonly server: string | null
  /** Donde se encontro: asi el operador sabe que archivo mirar. */
  readonly source: string | null
  /** Estadisticas del indice si ya existe; null si configurado pero sin indexar. */
  readonly stats?: GraphStats | null
}

export const NOT_INSTALLED: GraphStatus = {
  state: 'no-instalado',
  server: null,
  source: null
}

/** Comando de instalacion, para no obligar al operador a buscarlo. */
export const INSTALL_HINT = 'claude mcp add codebase-memory -- npx -y codebase-memory-mcp'
