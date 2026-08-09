/** Canales de las acciones del grafo: instalar (con progreso), verificar, A/B. */
export const GRAPH_CHANNELS = {
  graphInstall: 'graph:install',
  graphProgress: 'graph:progress',
  graphVerify: 'graph:verify',
  graphAb: 'graph:ab',
  graphReindex: 'graph:reindex',
  graphState: 'graph:state',
  graphReindexChanged: 'graph:reindex:changed',
  projectsFocus: 'projects:focus'
} as const
