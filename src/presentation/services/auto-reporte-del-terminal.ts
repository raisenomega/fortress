import { lazoStop } from '@domain/system/lazo-decision'
import { useLazoStore } from '../stores/lazo-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { submitConstruir } from './construir-service'
import { MAX_VUELTAS_DEFECTO, nadaQueHacerAhora } from './lazo-trabajo'
import { reportarAlChat } from './reporte-del-turno'

/**
 * El carril de VUELTA del lazo autonomo (Sello 2b-b): cuando el Terminal termina
 * un turno DENTRO del lazo (activo) y en AUTONOMO, su reporte vuelve solo al CTO
 * tras la ventana de 5s cancelable, y el CTO arranca el siguiente turno. La
 * parada la decide `lazoStop`; si dispara, el lazo se apaga y no hay vuelta.
 */
export function autoReporteDelTerminal(projectId: string): void {
  const lazo = useLazoStore.getState()
  if (!lazo.activo || useSettingsStore.getState().mode !== 'autonomo') return

  const stop = lazoStop({
    cancelled: false, // Detener ya habria apagado `activo` (guarda de arriba)
    topeDiario: false, // lo cobra el gate del envio: un turno negado no llega aqui
    iteraciones: lazo.iteraciones,
    maxIteraciones: MAX_VUELTAS_DEFECTO,
    nadaQueHacer: nadaQueHacerAhora(projectId) // sin vivos (o estancado) -> para
  })
  if (stop !== null) {
    lazo.parar()
    return
  }

  useSaltoStore.getState().programar('al-cto', ESPERA_DEL_SALTO_MS, () => {
    reportarAlChat(projectId) // precarga el reporte en el CTO + navega
    submitConstruir(projectId) // y lo envia: el CTO produce el siguiente PASO
    useLazoStore.getState().vuelta()
  })
}
