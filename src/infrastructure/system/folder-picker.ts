import { BrowserWindow, dialog } from 'electron'
import type { NewProject } from '@domain/project/project'
import { inspectProject } from './project-inspector'

/**
 * Abre el selector de carpetas nativo del sistema y devuelve el proyecto ya
 * inspeccionado, o null si el operador cancelo.
 */
export async function pickProjectFolder(parent: BrowserWindow | null): Promise<NewProject | null> {
  const options: Electron.OpenDialogOptions = {
    title: 'Selecciona la carpeta del proyecto',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Agregar a FORTRESS'
  }

  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)

  const [selected] = result.filePaths
  if (result.canceled || !selected) return null

  return inspectProject(selected)
}
