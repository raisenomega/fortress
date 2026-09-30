import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { BudgetField } from './BudgetField'

/**
 * Lo que acota al MOTOR cuando drena FORTRESS.
 *
 * Los dos son OBLIGATORIOS y NO traen valor por defecto: nadie decide por el
 * operador cuanto esta dispuesto a gastar. Si no los fija, el drenaje corta en
 * la primera vuelta —`gastado() >= 0`— en vez de gastar a ciegas.
 *
 * Se llamaban «Loop autonomo» y eran seis. ADR-107 retiro el loop, y con el las
 * CUATRO valvulas —denegaciones seguidas, volver a escanear cada, vueltas en
 * vacio, descartes seguidos—: describian el comportamiento de un bucle que se
 * repite solo, y el drenaje no se repite solo; recorre los elegibles una vez y
 * para cuando se agotan. El corte entre frenos duros y valvulas ya estaba
 * declarado en `loop-budget.ts`, y aqui solo se cobra.
 *
 * Las CLAVES guardadas siguen diciendo `loop*` a proposito: renombrarlas
 * obligaria a migrar los valores que el operador ya tiene escritos. Se renombra
 * lo que se VE.
 */
export function TopesDelMotorSection(): React.JSX.Element {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-sm font-semibold text-foreground">Topes del motor</h3>
        <p className="text-xs text-muted-foreground">
          Acotan el drenaje de FORTRESS. Los DOS son obligatorios y no traen valor por defecto: el
          drenaje se detiene al superar el gasto o el numero de propuestas, lo que ocurra primero.
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
