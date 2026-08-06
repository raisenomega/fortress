import { useEffect } from 'react'
import { loadGenesisConfigured } from '../../services/genesis-service'
import { loadCapabilities } from '../../services/self-improvement-service'
import { useCapabilities } from '../../stores/self-improvement-store'
import { useGenesisConfigured, useGenesisStatus } from '../../stores/genesis-store'
import { CapabilitiesSection } from '../system/CapabilitiesSection'
import { GenesisHud } from './GenesisHud'
import { GenesisToggle } from './GenesisToggle'

/**
 * Genesis de agentes: el bucle entrena capacidades por su cuenta y para en los
 * topes. Un agente se entrena solo, pero su activacion sigue exigiendo tu firma
 * (desde la tarjeta de la capacidad). OMEGA veta siempre.
 */
export function GenesisView(): React.JSX.Element {
  const status = useGenesisStatus()
  const configured = useGenesisConfigured()
  const capabilities = useCapabilities()

  useEffect(() => {
    void loadGenesisConfigured()
    void loadCapabilities()
  }, [])

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Genesis de agentes</h2>
        <p className="text-xs text-muted-foreground">
          El bucle entrena capacidades por su cuenta y para en los topes. Activar un agente sigue
          exigiendo tu firma; OMEGA veta siempre.
        </p>
      </header>
      {configured ? null : (
        <p className="text-xs text-critical">
          Fija los topes de genesis en Configuracion para poder encenderlo.
        </p>
      )}
      <GenesisToggle />
      {status ? <GenesisHud status={status} /> : null}
      <CapabilitiesSection capabilities={capabilities} />
    </div>
  )
}
