import { useUiStore } from '../../stores/ui-store'

const RULES: ReadonlyArray<readonly [string, string]> = [
  ['Puntuacion', 'Veracidad 60% + Cumplimiento 40% (solo dimensiones con datos reales)'],
  ['Bandas', '>=90 confiable · >=75 general · >=60 cuestionable · >=40 no confiable'],
  ['Rol de OMEGA', 'Testigo: nunca modifica codigo ni ejecuta acciones correctivas'],
  ['Libro de la Vida', 'Append-only: no se borra ni edita; sobrevive al proyecto'],
  ['Verificacion', 'Cada hallazgo se comprueba contra el filesystem real (solo lectura)']
]

/** Scope de CONFIGURACION: las reglas fijas de OMEGA. Sin sliders falsos: son
 *  invariantes del sistema, no parametros que se puedan maquillar. */
export function OmegaConfigView(): React.JSX.Element {
  const setView = useUiStore((s) => s.setView)

  return (
    <div className="space-y-3">
      <dl className="space-y-2 rounded-md border border-border bg-card p-3 text-xs">
        {RULES.map(([key, value]) => (
          <div key={key}>
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => setView('settings')}
        className="tap rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Ir a ajustes de la app
      </button>
    </div>
  )
}
