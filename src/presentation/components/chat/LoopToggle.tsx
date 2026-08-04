import { useEffect, useState } from 'react'
import type { Project } from '@domain/project/project'
import { loopConfigured, parseLoopBudget } from '@domain/settings/loop-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { api } from '../../adapters/fortress-api'
import { setProjectLoopEnabled } from '../../services/project-service'
import { Icon } from '../common/Icon'

interface LoopToggleProps {
  readonly project: Project
}

function title(configured: boolean, trusted: boolean, on: boolean): string {
  if (!configured) return 'Fija y guarda los topes del loop en Configuracion para habilitarlo'
  if (!trusted) return 'Marca el proyecto de confianza: el loop edita codigo del repo'
  return on ? 'Loop ENCENDIDO. Click para apagar.' : 'Loop apagado. Click para encender el ciclo.'
}

function tone(ready: boolean, on: boolean): string {
  if (!ready) return 'border-border text-muted-foreground opacity-50'
  return on ? 'border-success/40 text-success' : 'border-medium/40 text-medium'
}

/**
 * Checkmark del loop autonomo. DESHABILITADO hasta que haya topes guardados
 * (Configuracion) y el proyecto sea de confianza: encenderlo exige ambos.
 * Verde = encendido, gris = apagado.
 */
export function LoopToggle({ project }: LoopToggleProps): React.JSX.Element {
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    void Promise.all([
      api().settings.get(SETTINGS_KEYS.loopCostCap),
      api().settings.get(SETTINGS_KEYS.loopMaxCycles)
    ]).then(([cap, cycles]) => setConfigured(loopConfigured(parseLoopBudget(cap, cycles))))
  }, [project.id])

  const on = project.loopEnabled
  const ready = configured && project.trusted

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => void setProjectLoopEnabled(project.id, !on)}
      title={title(configured, project.trusted, on)}
      className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tracking-wide uppercase ${tone(ready, on)}`}
    >
      <Icon name="check-circle" size={11} />
      Loop
    </button>
  )
}
