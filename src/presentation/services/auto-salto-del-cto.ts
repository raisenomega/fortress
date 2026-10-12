import { extraerPaso } from '@domain/build/extraer-paso'
import { useAgentStore } from '../stores/agent-store'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { useUiStore } from '../stores/ui-store'
import { enviar } from './puerta-del-envio'

/**
 * Primer medio del lazo autonomo (Sello 2b-a): cuando el CTO termina su turno y
 * emitio un PASO, en modo AUTONOMO ese PASO salta SOLO al Terminal tras la
 * ventana cancelable. En supervisado NO salta nada —el operador aprueba—; sin
 * PASO tampoco (fail-safe del extractor).
 *
 * El envio pasa por `enviar`, el MISMO gate del envio manual: en autonomo
 * ejecuta y, si hay un lote en vuelo, respeta su cola. Abrir el Terminal primero
 * deja ver que sale.
 */
export function autoSaltoDelCto(textoDelCto: string): void {
  if (useSettingsStore.getState().mode !== 'autonomo') return
  const paso = extraerPaso(textoDelCto)
  if (paso === null) return

  useSaltoStore.getState().programar('al-terminal', ESPERA_DEL_SALTO_MS, () => {
    useUiStore.getState().setView('chat')
    const envio = {
      projectId: useProjectStore.getState().activeProjectId,
      mode: useSettingsStore.getState().mode,
      excludedAgents: useAgentStore.getState().excluded
    }
    enviar(envio, paso, false)
    useLazoStore.getState().activar() // el salto enciende el lazo (Sello 2b)
  })
}
