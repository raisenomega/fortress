import { DEFAULT_BUDGET } from '@domain/settings/run-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { BillingNote } from './BillingNote'
import { BudgetField } from './BudgetField'

/**
 * Los topes los decide el operador. FORTRESS trae un valor de arranque, pero
 * cuanto esta dispuesto a gastar al dia no es una decision de la app.
 */
export function BudgetSection(): React.JSX.Element {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Topes de gasto</h3>
        <p className="text-xs text-muted-foreground">
          El tope por ejecucion lo aplica Claude Code y corta el proceso al llegar. El diario lo
          comprueba FORTRESS antes de arrancar nada.
        </p>
      </header>

      <BillingNote />

      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetField
          settingKey={SETTINGS_KEYS.budgetPerRun}
          label="Por ejecucion"
          fallback={DEFAULT_BUDGET.perRun}
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.budgetPerDay}
          label="Por dia"
          fallback={DEFAULT_BUDGET.perDay}
        />
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cero desactiva el tope. Un escaneo de un repositorio grande ronda $1.
      </p>
    </section>
  )
}
