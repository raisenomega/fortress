import type { MotorChainDeps } from '@application/repair/run-motor-chain'
import { buildAutoMergeDeps, buildGateDeps, buildGenerateDeps, buildOmegaDeps } from './repair-deps'

/**
 * Las dependencias reales de una vuelta entera del motor, armadas de una vez.
 *
 * Se construyen POR VUELTA y no una sola vez al arrancar: cada constructor mira
 * la configuracion vigente —topes, claves, politica del proyecto—, y una sesion
 * de loop puede durar horas. Cachearlas dejaria al motor corriendo con los
 * ajustes que hubiera cuando el operador pulso, no con los de ahora.
 *
 * El `projectId` baja hasta los spawn para que sus procesos queden registrados
 * a nombre de este proyecto: sin eso, Detener no los alcanza.
 */
export function buildMotorChainDeps(projectId: string): MotorChainDeps {
  return {
    generate: buildGenerateDeps(projectId),
    gate: buildGateDeps(projectId),
    judge: { omega: buildOmegaDeps(projectId), autoMerge: buildAutoMergeDeps() }
  }
}
