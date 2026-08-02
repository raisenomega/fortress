import { LEVEL_COLOR, LEVEL_ICON, LEVEL_LABEL, problemsOf } from '@domain/health/health-check'
import { runHealthCheck } from '../../services/health-service'
import { useHealthStore } from '../../stores/health-store'
import { Icon } from '../common/Icon'
import { Modal } from '../common/Modal'
import { HealthCheckRow } from './HealthCheckRow'

export function HealthPanel(): React.JSX.Element {
  const report = useHealthStore((state) => state.report)
  const running = useHealthStore((state) => state.running)
  const setPanelOpen = useHealthStore((state) => state.setPanelOpen)

  const problems = report ? problemsOf(report).length : 0

  return (
    <Modal title="Diagnostico del sistema" onClose={() => setPanelOpen(false)}>
      {report ? (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm">
            <Icon name={LEVEL_ICON[report.level]} size={15} className={LEVEL_COLOR[report.level]} />
            {LEVEL_LABEL[report.level]}
            <span className="text-muted-foreground">
              {problems === 0 ? '· nada que arreglar' : `· ${problems} a revisar`}
            </span>
          </p>

          <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {report.checks.map((check) => (
              <HealthCheckRow key={check.id} check={check} />
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Todavia no se ha ejecutado el diagnostico.</p>
      )}

      <footer className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={running}
          onClick={() => void runHealthCheck()}
          className="tap rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
        >
          {running ? 'Comprobando...' : 'Volver a comprobar'}
        </button>
      </footer>
    </Modal>
  )
}
