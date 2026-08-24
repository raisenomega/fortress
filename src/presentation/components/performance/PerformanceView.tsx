import { useEffect } from 'react'
import { loadPerformance } from '../../services/performance-service'
import { usePerformanceStore } from '../../stores/performance-store'
import { CognitionBlock } from '../cognition/CognitionBlock'
import { AgentRankingList } from './AgentRankingList'
import { ScoreTrend } from './ScoreTrend'
import { SeverityChart } from './SeverityChart'
import { TokensByProject } from './TokensByProject'
import { UsageCards } from './UsageCards'
import { WindowPicker } from './WindowPicker'

export function PerformanceView(): React.JSX.Element {
  const window = usePerformanceStore((state) => state.window)
  const usage = usePerformanceStore((state) => state.usage)
  const sinFactura = usePerformanceStore((state) => state.sinFactura)
  const byProject = usePerformanceStore((state) => state.byProject)
  const ranking = usePerformanceStore((state) => state.ranking)
  const scans = usePerformanceStore((state) => state.scans)
  const loading = usePerformanceStore((state) => state.loading)

  // El picker solo cambia la ventana; este efecto es el unico que carga, asi
  // no se dispara dos veces (una por el onPick y otra por el cambio de estado).
  useEffect(() => {
    void loadPerformance(window)
  }, [window])

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <div className="flex items-center gap-3">
        <WindowPicker
          current={window}
          onPick={(next) => usePerformanceStore.getState().setWindow(next)}
        />
        {loading ? <span className="text-xs text-muted-foreground">Actualizando…</span> : null}
      </div>

      <UsageCards usage={usage} sinFactura={sinFactura} />

      <CognitionBlock title="Tokens por proyecto">
        <TokensByProject byProject={byProject} />
      </CognitionBlock>

      <CognitionBlock title="Score y tendencia">
        <ScoreTrend scans={scans} />
      </CognitionBlock>

      <div className="grid gap-5 lg:grid-cols-2">
        <CognitionBlock title="Agentes mas activos">
          <AgentRankingList ranking={ranking} />
        </CognitionBlock>

        <CognitionBlock title="Hallazgos abiertos por severidad">
          <SeverityChart />
        </CognitionBlock>
      </div>
    </div>
  )
}
