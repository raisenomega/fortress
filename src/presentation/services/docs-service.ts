import { api } from '../adapters/fortress-api'
import { reportError } from '../stores/toast-store'

/** Los .md de la raiz del proyecto (marco de gobierno + cualquier otro doc). */
export async function loadDocs(projectId: string): Promise<readonly string[]> {
  try {
    return await api().docs.list(projectId)
  } catch {
    return []
  }
}

/** Contenido de un .md para leerlo en la app. '' si falla (con aviso). */
export async function readDoc(projectId: string, name: string): Promise<string> {
  try {
    const result = await api().docs.read(projectId, name)
    if (result.ok) return result.value
    reportError(result.error)
  } catch {
    reportError('No se pudo leer el documento')
  }
  return ''
}
