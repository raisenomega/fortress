import type { ElectronAPI } from '@electron-toolkit/preload'
import type { FortressApi } from './api-types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: FortressApi
  }
}
