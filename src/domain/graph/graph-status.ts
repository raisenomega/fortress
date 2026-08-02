export type GraphState = 'no-instalado' | 'configurado'

export interface GraphStatus {
  readonly state: GraphState
  /** Nombre del servidor MCP detectado, si lo hay. */
  readonly server: string | null
  /** Donde se encontro: asi el operador sabe que archivo mirar. */
  readonly source: string | null
}

export const NOT_INSTALLED: GraphStatus = {
  state: 'no-instalado',
  server: null,
  source: null
}

/** Comando de instalacion, para no obligar al operador a buscarlo. */
export const INSTALL_HINT = 'claude mcp add codebase-memory -- npx -y codebase-memory-mcp'
