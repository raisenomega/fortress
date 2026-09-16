import type { Project } from '@domain/project/project'
import { usePushResult } from '../../stores/push-store'
import { useScanError } from '../../stores/scan-selectors'
import { useScanStore } from '../../stores/scan-store'
import { Notice } from '../common/Notice'
import { CoberturaNotice } from './CoberturaNotice'
import { ParadaEnVivo } from './ParadaEnVivo'
import { hayParadaQueEnsenar } from './parada-linea'

interface AvisosDelEscaneoProps {
  readonly project: Project
}

/**
 * Los avisos del escaneo, en la zona que SCROLLEA. Fuera del bloque fijo a
 * proposito: la parada en vivo y la cobertura crecen sin techo, y una cabecera
 * que cambia de alto sola mientras trabajas marea mas de lo que informa.
 *
 * El progreso del escaneo es la unica excepcion y vive en `CabeceraFija`.
 */
export function AvisosDelEscaneo({ project }: AvisosDelEscaneoProps): React.JSX.Element {
  const error = useScanError(project.id)
  const push = usePushResult(project.id)
  const parada = useScanStore((state) => state.parada)
  const summary = useScanStore((state) => state.lastSummary)
  const running = useScanStore((state) => state.runningProjectId) === project.id

  return (
    <>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {push ? <Notice tone={push.failed ? 'error' : 'ok'}>{push.output}</Notice> : null}
      {summary?.projectId === project.id && !running ? (
        <CoberturaNotice cobertura={summary.cobertura} />
      ) : null}
      {hayParadaQueEnsenar(running, parada) ? <ParadaEnVivo parada={parada} /> : null}
    </>
  )
}
