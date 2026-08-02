import { useNewProjectStore } from '../../stores/new-project-store'
import { Notice } from '../common/Notice'

/**
 * La ruta final, escrita entera. Es lo unico que separa "crear una carpeta" de
 * "escribir en un sitio que el operador no esperaba".
 */
export function TargetPreview(): React.JSX.Element | null {
  const target = useNewProjectStore((state) => state.target)
  const existing = useNewProjectStore((state) => state.existing)
  const useExisting = useNewProjectStore((state) => state.useExisting)
  const setUseExisting = useNewProjectStore((state) => state.setUseExisting)

  if (target === null) return null

  return (
    <div className="space-y-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Se creara en</p>
      <code className="block rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-xs break-all text-foreground">
        {target}
      </code>

      {existing === null ? null : (
        <Notice tone="error">
          Esa carpeta ya existe y contiene {existing}.
          <label className="mt-2 flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={useExisting}
              onChange={(event) => setUseExisting(event.target.checked)}
            />
            Usarla igualmente. FORTRESS escribira dentro sin borrar lo que hay.
          </label>
        </Notice>
      )}
    </div>
  )
}
