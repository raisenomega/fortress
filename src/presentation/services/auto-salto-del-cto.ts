import { extraerPaso } from '@domain/build/extraer-paso'
import { useAgentStore } from '../stores/agent-store'
import { useLazoStore } from '../stores/lazo-store'
import { useProjectStore } from '../stores/project-store'
import { ESPERA_DEL_SALTO_MS, useSaltoStore } from '../stores/salto-store'
import { useSettingsStore } from '../stores/settings-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'
import { empujonAlCto } from './empujon-del-cto'
import { enviar } from './puerta-del-envio'

/** ATERRIZAJE-2: enfoca la CABEZA de la cola congelada antes del envio. Con foco,
 *  el Terminal entra por la rama CON JUEZ (OMEGA, `turno-del-terminal.ts:54`) y
 *  se abre el cierre/verify del hallazgo (`trasElTurno`, ADR-088). Sin cabeza
 *  —cola vacia o aun sin congelar— no enfoca: el turno va como hoy, sin foco. */
function enfocarLaCabeza(projectId: string): void {
  const cabeza = useLazoStore.getState().cola?.[0] ?? null
  if (cabeza !== null) useWorkflowStore.getState().setFoco({ projectId, findingId: cabeza })
}

/**
 * Primer medio del lazo autonomo (Sello 2b-a): cuando el CTO termina su turno y
 * emitio un PASO, en modo AUTONOMO ese PASO salta SOLO al Terminal tras la
 * ventana cancelable, ENFOCANDO la cabeza de la cola (ATERRIZAJE-2). En
 * supervisado NO salta nada; sin PASO tampoco (fail-safe del extractor).
 *
 * El envio pasa por `enviar`, el MISMO gate del envio manual. `activar` va ANTES
 * de la ventana: enciende el lazo y el hook congela la cola mientras corren los
 * 5s, asi en el disparo ya hay cabeza que enfocar.
 */
export function autoSaltoDelCto(textoDelCto: string): void {
  if (useSettingsStore.getState().mode !== 'autonomo') return
  const paso = extraerPaso(textoDelCto)
  if (paso === null) {
    empujonAlCto() // no-PASO: pasa al siguiente (o para) en vez de morir callado
    return
  }
  useLazoStore.getState().activar() // enciende el lazo (Sello 2b) y dispara la carga de la cola

  useSaltoStore.getState().programar('al-terminal', ESPERA_DEL_SALTO_MS, () => {
    const projectId = useProjectStore.getState().activeProjectId
    if (projectId !== null) enfocarLaCabeza(projectId)
    useUiStore.getState().setView('chat')
    const envio = { projectId, mode: useSettingsStore.getState().mode, excludedAgents: useAgentStore.getState().excluded } // prettier-ignore
    enviar(envio, paso, false)
  })
}
