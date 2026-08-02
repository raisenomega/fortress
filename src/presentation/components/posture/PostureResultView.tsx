import { scoreBand } from '@domain/project/fortress-score'
import { sendPostureToChat } from '../../services/posture-service'
import { usePostureStore } from '../../stores/posture-store'
import { SeverityBadge } from '../scan/SeverityBadge'

const BAND = { solido: 'text-success', aceptable: 'text-medium', riesgo: 'text-critical' } as const

export function PostureResultView(): React.JSX.Element | null {
  const result = usePostureStore((state) => state.result)
  if (!result) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`font-mono text-3xl font-bold ${BAND[scoreBand(result.score)]}`}>
          {result.score}
        </span>
        <div className="text-xs text-muted-foreground">
          <p className="text-foreground">{result.host}</p>
          <p>{result.findings.length} hallazgos · solo lectura, sin ataques</p>
        </div>
        <button
          type="button"
          onClick={sendPostureToChat}
          className="tap ml-auto rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary/40"
        >
          Llevar al chat
        </button>
      </div>

      <ul className="space-y-2">
        {result.findings.map((finding, index) => (
          <li key={index} className="rounded-md border border-border/60 p-2.5">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <span className="text-sm text-foreground">{finding.title}</span>
            </div>
            <p className="mt-1 font-mono text-[11px] break-all text-muted-foreground">
              {finding.evidence}
            </p>
            <p className="mt-0.5 text-[11px] text-primary">Fix: {finding.fix}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
