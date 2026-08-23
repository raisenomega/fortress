import { useEffect, useState } from 'react'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../adapters/fortress-api'

export interface Topes {
  readonly costCapUsd: string
  readonly maxVueltas: string
}

/** Sin fijar no se inventa un numero: se dice que no hay tope escrito. */
const SIN_FIJAR = 'sin tope'
const conDolar = (v: string | null): string => (v === null || v === '' ? SIN_FIJAR : `$${v}`)

/**
 * Los topes con los que correria el drenaje, leidos al abrir la confirmacion y
 * no al montar el panel: son ajustes que el operador puede cambiar en otra
 * pestana, y ensenarle los de hace media hora seria pedirle que autorice un
 * gasto con la cifra vieja.
 */
export function useTopesDelDrenaje(abierto: boolean): Topes {
  const [topes, setTopes] = useState<Topes>({ costCapUsd: SIN_FIJAR, maxVueltas: SIN_FIJAR })

  useEffect(() => {
    if (!abierto) return
    void Promise.all([
      api().settings.get(SETTINGS_KEYS.loopCostCap),
      api().settings.get(SETTINGS_KEYS.loopMaxCycles)
    ]).then(([cap, vueltas]) =>
      setTopes({ costCapUsd: conDolar(cap), maxVueltas: vueltas ?? SIN_FIJAR })
    )
  }, [abierto])

  return topes
}
