/** Nombres de canal centralizados: main y preload comparten esta fuente. */
export const IPC = {
  projectsList: 'projects:list',
  projectsAdd: 'projects:add',
  projectsRemove: 'projects:remove',
  projectsPickFolder: 'projects:pick-folder',
  projectsSelf: 'projects:self',
  healthRun: 'health:run',
  scanRun: 'scan:run',
  scanFindings: 'scan:findings',
  scanCounts: 'scan:counts',
  scanHistory: 'scan:history',
  scanHistorySince: 'scan:history-since',
  scanDismiss: 'scan:dismiss',
  scanReopen: 'scan:reopen',
  /** Evento main -> renderer con el avance del escaneo. */
  scanProgress: 'scan:progress',
  pushRun: 'push:run',
  telemetrySession: 'telemetry:session',
  telemetrySince: 'telemetry:since',
  telemetryByProject: 'telemetry:by-project',
  telemetryRanking: 'telemetry:ranking',
  cognitionRead: 'cognition:read',
  graphStatus: 'graph:status',
  activityProject: 'activity:project',
  activityAgent: 'activity:agent',
  agentStats: 'agent:stats',
  chatHistory: 'chat:history',
  chatAppend: 'chat:append',
  chatClear: 'chat:clear',
  chatSend: 'chat:send',
  /** Evento main -> renderer con cada fragmento del streaming. */
  chatChunk: 'chat:chunk',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsSaveApiKey: 'settings:save-api-key',
  settingsHasApiKey: 'settings:has-api-key',
  settingsCheckApiKey: 'settings:check-api-key',
  settingsClearApiKey: 'settings:clear-api-key'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
