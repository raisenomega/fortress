import { lazoStop } from '@domain/system/lazo-decision'
import { useLazoStore } from '../stores/lazo-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { avanzarCola } from './avanzar-cola'
import { comitearDelLazo } from './comitear-del-lazo'
import { submitConstruir } from './construir-service'
import { dirigirAlCto } from './dirigir-al-cto'
import { loadCounts } from './scan-service'
import { MAX_VUELTAS_DEFECTO, nadaQueHacerAhora } from './lazo-trabajo'
import { reportarAlChat } from './reporte-del-turno'

/**
 * El cierre de la vuelta, tras la ventana (ATERRIZAJE-4 y -5): ATERRIZA el
 * trabajo del agente (commit), AVANZA la cola si el hallazgo trabajado se
 * extinguio de verdad, refresca las cuentas —el candado de push se abre SOLO al
 * caer los CRITICAL; el lazo NUNCA pushea—, y si la cola quedo vacia PARA; si no,
 * reporta al CTO dirigido al NUEVO hallazgo de la cabeza.
 */
async function cerrarLaVuelta(projectId: string): Promise<void> {
  const trabajado = useLazoStore.getState().cola?.[0] ?? null
  if (trabajado !== null) {
    await comitearDelLazo(projectId) // commit del trabajo de la cabeza (A-4)
    await avanzarCola(projectId, trabajado) // pop SOLO si se extinguio (A-5)
  }
  void loadCounts() // recalcula el candado de push con cuentas vivas (no bloquea)
  if (nadaQueHacerAhora(projectId)) {
    useLazoStore.getState().parar()
    return
  }
  reportarAlChat(projectId)
  dirigirAlCto(projectId)
  submitConstruir(projectId)
  useLazoStore.getState().vuelta()
}

/**
 * El carril de VUELTA del lazo autonomo (Sello 2b-b): cuando el Terminal termina
 * un turno DENTRO del lazo (activo) y en AUTONOMO, tras la ventana de 5s cierra
 * la vuelta. La parada la decide `lazoStop`; si dispara, el lazo se apaga.
 */
export function autoReporteDelTerminal(projectId: string): void {
  const lazo = useLazoStore.getState()
  if (!lazo.activo || useSettingsStore.getState().mode !== 'autonomo') return
  const stop = lazoStop({ cancelled: false, topeDiario: false, iteraciones: lazo.iteraciones, maxIteraciones: MAX_VUELTAS_DEFECTO, nadaQueHacer: nadaQueHacerAhora(projectId) }) // prettier-ignore
  if (stop !== null) {
    lazo.parar()
    return
  }
  useSaltoStore.getState().programar('al-cto', ESPERA_DEL_SALTO_MS, () => void cerrarLaVuelta(projectId)) // prettier-ignore
}
