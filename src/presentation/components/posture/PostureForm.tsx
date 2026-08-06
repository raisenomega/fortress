import { DEPTH_LABEL, SCAN_DEPTHS } from '@domain/posture/scan-depth'
import { runPosture } from '../../services/posture-service'
import { usePostureStore } from '../../stores/posture-store'
import { FIELD_CLASS, LabeledField } from '../common/LabeledField'

/** Metes la URL de tu sitio, confirmas que es tuyo, eliges cuanto revisar. */
export function PostureForm(): React.JSX.Element {
  const { url, depth, owned, running } = usePostureStore()
  const store = usePostureStore.getState()

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <LabeledField label="Direccion de tu sitio en produccion">
        <input
          value={url}
          placeholder="midominio.com"
          onChange={(event) => store.setUrl(event.target.value)}
          className={`${FIELD_CLASS} font-mono`}
        />
      </LabeledField>

      <LabeledField label="Profundidad">
        <select
          value={depth}
          onChange={(event) => store.setDepth(event.target.value as never)}
          className={FIELD_CLASS}
        >
          {SCAN_DEPTHS.map((option) => (
            <option key={option} value={option}>
              {DEPTH_LABEL[option]}
            </option>
          ))}
        </select>
      </LabeledField>

      <label className="flex items-start gap-2 text-xs text-foreground">
        <input
          type="checkbox"
          checked={owned}
          onChange={(event) => store.setOwned(event.target.checked)}
          className="mt-0.5"
        />
        Confirmo que este sitio es mio o tengo permiso para auditarlo.
      </label>

      <button
        type="button"
        disabled={running || !owned || url.trim() === ''}
        onClick={() => void runPosture()}
        className="tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {running ? 'Auditando...' : 'Auditar exposicion'}
      </button>
    </div>
  )
}
