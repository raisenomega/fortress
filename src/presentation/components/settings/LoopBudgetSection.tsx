import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { BudgetField } from './BudgetField'

/**
 * Topes del loop autonomo: SIN valores por defecto. Frenos obligatorios; hasta
 * que ambos esten guardados (> 0), el checkmark del loop no se puede encender.
 */
export function LoopBudgetSection(): React.JSX.Element {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Loop autonomo</h3>
        <p className="text-xs text-muted-foreground">
          Frenos OBLIGATORIOS. Sin ambos guardados no se puede encender el loop. El loop se detiene
          solo al superar el gasto o el numero de propuestas, lo que ocurra primero.
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
      </div>
    </section>
  )
}
