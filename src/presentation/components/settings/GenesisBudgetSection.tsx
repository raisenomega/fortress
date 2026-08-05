import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { BudgetField } from './BudgetField'

/**
 * Topes del bucle de genesis: SIN valores por defecto. Frenos obligatorios; hasta
 * que ambos esten guardados (> 0), el bucle de genesis no se puede encender.
 */
export function GenesisBudgetSection(): React.JSX.Element {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Genesis de agentes</h3>
        <p className="text-xs text-muted-foreground">
          Frenos OBLIGATORIOS del gasto autonomo. Sin ambos guardados no se puede encender.
          El bucle se detiene solo al superar el gasto o el numero de episodios.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetField
          settingKey={SETTINGS_KEYS.genesisCostCap}
          label="Tope de gasto por sesion"
          unit="USD"
        />
        <BudgetField
          settingKey={SETTINGS_KEYS.genesisMaxEpisodes}
          label="Maximo de episodios"
          unit="episodios"
        />
      </div>
    </section>
  )
}
