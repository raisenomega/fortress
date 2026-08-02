/** Nombres de canal centralizados: main y preload comparten esta fuente. */
export const IPC = {
  projectsList: 'projects:list',
  projectsAdd: 'projects:add',
  projectsRemove: 'projects:remove',
  projectsPickFolder: 'projects:pick-folder',
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
