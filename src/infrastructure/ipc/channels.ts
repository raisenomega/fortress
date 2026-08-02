/** Nombres de canal centralizados: main y preload comparten esta fuente. */
export const IPC = {
  projectsList: 'projects:list',
  projectsAdd: 'projects:add',
  projectsRemove: 'projects:remove',
  chatHistory: 'chat:history',
  chatAppend: 'chat:append',
  chatClear: 'chat:clear',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
