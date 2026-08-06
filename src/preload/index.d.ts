import type { FortressApi } from './api-types'

declare global {
  interface Window {
    // Solo se expone `api`: el bridge no publica `ipcRenderer` crudo. Declarar
    // aqui un `electron` que no existe invitaba a "arreglarlo" exponiendolo.
    api: FortressApi
  }
}
