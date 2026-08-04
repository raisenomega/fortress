import { parseConnectorUrl } from '@domain/connectors/connector-url'
import { api } from '../adapters/fortress-api'
import { useConnectorsStore } from '../stores/connectors-store'

async function refresh(): Promise<void> {
  useConnectorsStore.getState().setItems(await api().connectors.list())
}

export async function loadConnectors(): Promise<void> {
  await refresh()
}

export async function toggleConnector(id: string, on: boolean): Promise<void> {
  await api().connectors.setEnabled(id, on)
  await refresh()
}

/**
 * Valida antes de cruzar el puente para dar el error al instante. El main
 * vuelve a validar igualmente: esto es comodidad, no la barrera.
 */
export async function addConnector(): Promise<void> {
  const store = useConnectorsStore.getState()
  if (store.saving) return

  const url = parseConnectorUrl(store.draft.url)
  if (!url.ok) {
    store.setError(url.error)
    return
  }

  store.setSaving(true)
  const result = await api().connectors.add({ ...store.draft, url: url.value })
  store.setSaving(false)
  store.setError(result.ok ? null : result.error)
  if (result.ok) store.resetDraft()
  await refresh()
}

export async function removeConnector(id: string): Promise<void> {
  const result = await api().connectors.remove(id)
  useConnectorsStore.getState().setError(result.ok ? null : result.error)
  await refresh()
}
