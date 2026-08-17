import { powerSaveBlocker } from 'electron'

/** Quien pide que la maquina no se duerma. Cada uno responde de lo suyo. */
export type KeepAwakeOrigin = 'operator' | 'loop'

const pidiendo = new Set<KeepAwakeOrigin>()
let displayId: number | null = null
let suspensionId: number | null = null

const arrancar = (tipo: 'prevent-display-sleep' | 'prevent-app-suspension'): number =>
  powerSaveBlocker.start(tipo)

const soltar = (id: number | null): null => {
  if (id !== null && powerSaveBlocker.isStarted(id)) powerSaveBlocker.stop(id)
  return null
}

/**
 * Los DOS candados de Electron, juntos: la pantalla encendida y la app sin
 * suspender. Uno solo no basta —una maquina que apaga la pantalla puede seguir
 * durmiendose, y ahi el motor deja de trabajar igual—, y el operador no tiene
 * por que conocer esa diferencia para pedir "no te duermas mientras trabajas".
 */
function aplicar(): void {
  if (pidiendo.size > 0) {
    if (displayId === null || !powerSaveBlocker.isStarted(displayId)) {
      displayId = arrancar('prevent-display-sleep')
    }
    if (suspensionId === null || !powerSaveBlocker.isStarted(suspensionId)) {
      suspensionId = arrancar('prevent-app-suspension')
    }
    return
  }
  displayId = soltar(displayId)
  suspensionId = soltar(suspensionId)
}

/**
 * El candado se cuenta por peticionario. El loop lo pide mientras trabaja y el
 * operador mientras quiera; que uno termine no puede soltar lo que el otro
 * sigue pidiendo. Antes era un solo interruptor: al parar el loop se apagaba
 * tambien la peticion explicita del operador, y la pantalla se dormia con su
 * boton en verde.
 */
export function requestKeepAwake(origin: KeepAwakeOrigin): void {
  pidiendo.add(origin)
  aplicar()
}

export function releaseKeepAwake(origin: KeepAwakeOrigin): void {
  pidiendo.delete(origin)
  aplicar()
}

/** Quien lo esta pidiendo ahora mismo. Para pruebas y diagnostico. */
export function keepAwakeOrigins(): readonly KeepAwakeOrigin[] {
  return [...pidiendo]
}
