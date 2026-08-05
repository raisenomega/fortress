import { AccountSection } from './AccountSection'
import { ApiKeySection } from './ApiKeySection'
import { BudgetSection } from './BudgetSection'
import { LoopBudgetSection } from './LoopBudgetSection'
import { GenesisBudgetSection } from './GenesisBudgetSection'
import { OperationModeSection } from './OperationModeSection'

/** Pantalla de configuracion, accesible desde la barra lateral. */
export function SettingsView(): React.JSX.Element {
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <header className="mb-5">
        <h2 className="text-xl">Configuracion</h2>
        <p className="text-sm text-muted-foreground">
          Todo se guarda en este equipo. FORTRESS no envia nada a ningun servidor propio.
        </p>
      </header>

      <div className="flex max-w-2xl flex-col gap-4">
        <AccountSection />
        <ApiKeySection />
        <BudgetSection />
        <LoopBudgetSection />
        <GenesisBudgetSection />
        <OperationModeSection />
      </div>
    </div>
  )
}
