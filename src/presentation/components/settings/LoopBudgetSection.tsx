import {
  DEFAULT_MAX_DENIALS,
  DEFAULT_MAX_NO_CANDIDATES,
  DEFAULT_RESCAN_EVERY
} from '@domain/settings/loop-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { BudgetField } from './BudgetField'

/**
 * Lo que acota el loop autonomo. Los dos frenos de gasto son OBLIGATORIOS y no
 * traen valor: hasta que ambos esten guardados (> 0), el checkmark del loop no
 * se puede encender. El tercero no frena gasto sino insistencia, y por eso trae
 * un valor sensato que el operador puede cambiar.
 */
export function LoopBudgetSection(): React.JSX.Element {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Loop autonomo</h3>
        <p className="text-xs text-muted-foreground">
          Los dos primeros son OBLIGATORIOS: sin ambos guardados no se puede encender el loop, y se
          detiene al superar el gasto o el numero de propuestas, lo que ocurra primero. El tercero
          lo para cuando la politica deniega esa cantidad de propuestas seguidas.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetField
          settingKey={SETTINGS_KEYS.loopCostCap}
          label="Tope de gasto por sesion"
          unit="USD"
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.loopMaxCycles}
          label="Maximo de propuestas"
          unit="propuestas"
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.loopMaxDenials}
          label="Denegaciones seguidas antes de parar"
          fallback={DEFAULT_MAX_DENIALS}
          unit="propuestas"
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.loopRescanEvery}
          label="Volver a escanear cada"
          fallback={DEFAULT_RESCAN_EVERY}
          unit="integraciones"
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.loopMaxNoCandidates}
          label="Vueltas en vacio antes de parar"
          fallback={DEFAULT_MAX_NO_CANDIDATES}
          unit="vueltas"
        />
      </div>
    </section>
  )
}
