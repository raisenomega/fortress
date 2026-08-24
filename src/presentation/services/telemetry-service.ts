import { api } from '../adapters/fortress-api'
import { useTelemetryStore } from '../stores/telemetry-store'

/**
 * Relee el consumo de la sesion. Se llama despues de cada ejecucion, no en un
 * intervalo: un contador que se refresca solo consume sin que nadie mire.
 */
export async function refreshSessionUsage(): Promise<void> {
  // Las dos en la misma tanda: el total y lo que el total no cuenta se leen a
  // la vez o el pie ensenaria una mitad vieja al lado de la otra nueva.
  const [session, sinMedir] = await Promise.all([
    api().telemetry.session(),
    api().telemetry.sinFactura('')
  ])
  useTelemetryStore.getState().setSession(session, sinMedir)
}

/**
 * Mantiene el medidor del pie al dia mientras trabaja el MOTOR.
 *
 * El pie cuenta todas las corridas de agente de la sesion —chat, escaneo y
 * motor—, pero solo el chat y el escaneo avisaban al terminar. El motor
 * gastaba en silencio: durante un drenaje la base engordaba corrida a corrida
 * y el pie seguia ensenando la cifra de arranque, cero si la app abrio limpia.
 * Un tope mal medido habria saltado a la vista el primer dia con el gasto
 * subiendo delante.
 *
 * Escucha el mismo golpecito que el expediente, que se manda en CADA asiento
 * —y el AGENT_RUN se asienta justo tras cada corrida—, asi que la cifra sube
 * mientras drena y no solo al final.
 *
 * Vive aqui y se monta UNA vez en el arranque, no en `useRepairFeed`: el pie se
 * ve desde cualquier pantalla, asi que su refresco no puede depender de que
 * haya una vista del motor abierta —ni multiplicarse por cada una que lo este.
 * Y no se filtra por proyecto porque el total de la sesion tampoco lo esta: si
 * el motor se movio en cualquier sitio, la cifra del pie cambio.
 */
export function subscribeMotorUsage(): () => void {
  return api().repair.onChanged(() => void refreshSessionUsage())
}

/** Se pregunta una vez al arrancar: no cambia a mitad de sesion. */
export async function loadBilling(): Promise<void> {
  useTelemetryStore.getState().setBilling(await api().telemetry.billing())
}
