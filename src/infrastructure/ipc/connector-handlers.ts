import { ipcMain } from 'electron'
import { CONNECTOR_CATEGORIES, type ConnectorCategory } from '@domain/connectors/connector'
import type { NewConnector } from '@domain/connectors/connector-repository'
import { parseConnectorUrl } from '@domain/connectors/connector-url'
import { err, type Result } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

const CATEGORIES = new Set<string>(CONNECTOR_CATEGORIES)

/**
 * El renderer no es una fuente de confianza: aunque el formulario ya valide,
 * la URL y la categoria se vuelven a comprobar aqui. Un renderer comprometido
 * podria invocar el canal a mano con http:// o con una categoria inventada.
 */
function sanitize(input: NewConnector): Result<NewConnector> {
  const url = parseConnectorUrl(String(input?.url ?? ''))
  if (!url.ok) return err(url.error)

  const category = String(input?.category ?? '')
  if (!CATEGORIES.has(category)) return err('Esa categoria no existe')

  return {
    ok: true,
    value: {
      name: String(input?.name ?? '').slice(0, 80),
      url: url.value,
      description: String(input?.description ?? '').slice(0, 300),
      category: category as ConnectorCategory
    }
  }
}

export function registerConnectorHandlers(): void {
  ipcMain.handle(IPC.connectorsList, () => getAppContext().connectors.list())

  ipcMain.handle(IPC.connectorsSetEnabled, (_event, id: string, on: boolean) => {
    getAppContext().connectors.setEnabled(String(id), on === true)
  })

  ipcMain.handle(IPC.connectorsAdd, (_event, input: NewConnector) => {
    const clean = sanitize(input)
    if (!clean.ok) return clean
    return getAppContext().connectors.addCustom(clean.value)
  })

  ipcMain.handle(IPC.connectorsRemove, (_event, id: string) =>
    getAppContext().connectors.remove(String(id))
  )
}
