import { BrowserWindow, dialog } from 'electron'

/**
 * Abre el selector de ARCHIVOS nativo y devuelve la ruta elegida, o null si el
 * operador cancelo. Para adjuntar un documento que el agente debe leer.
 */
export async function pickFile(parent: BrowserWindow | null): Promise<string | null> {
  const options: Electron.OpenDialogOptions = {
    title: 'Selecciona un archivo para el agente',
    properties: ['openFile'],
    buttonLabel: 'Adjuntar'
  }

  const result = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options)

  const [selected] = result.filePaths
  if (result.canceled || !selected) return null
  return selected
}
