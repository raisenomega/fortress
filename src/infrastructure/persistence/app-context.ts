import { createSqliteParadaRunRepository } from './sqlite-parada-run-repository'
import { informeWriter } from '../scan/escribir-informe'
import type { AppContext } from '@application/context'
import { createAnthropicKeyValidator } from '../ai/anthropic-key-validator'
import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createSafeStorageApiKeyStore } from '../security/api-key-store'
import { getDatabase } from './database'
import { writeScan } from '../cognition/write-cognition-log'
import { createGitFileHistory } from '../git/file-history'
import { createRutaDelControl } from '../project/ruta-del-control-git'
import { headSha } from '../git/head-sha'
import { isAncestor } from '../git/is-ancestor'
import { createFsProbe } from '../omega/fs-probe'
import { discoverCorpus } from '../project/discover-corpus'
import { barrerasDeclaradasDelProyecto } from '../project/barreras-declaradas-del-proyecto'
import { huellaDeConfig, readFortressConfig } from '../project/fortress-config'
import { isFortressRepo } from '../system/self-project'
import { puertosDeAutoMejora } from './app-context-automejora'
import { createGraphAnalyst } from '../repair/graph-analyst'
import { createSqliteActivityRepository } from './sqlite-activity-repository'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import { createSqliteChatRepository } from './sqlite-chat-repository'
import { createSqliteConnectorRepository } from './sqlite-connector-repository'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import { createSqliteLoopSessionRepository } from './sqlite-loop-session-repository'
import { createSqliteOmegaLog } from './sqlite-omega-log'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteQualityHistoryRepository } from './sqlite-quality-history-repository'
import { createRepairNotifier } from '../repair/repair-notifier'
import { createProposalEventLog } from './proposal-event-log'
import { createSqliteProposalEventRepository } from './sqlite-proposal-event-repository'
import { createSqliteGraphStateRepository } from './sqlite-graph-state-repository'
import { createSqliteRepairProposalRepository } from './sqlite-repair-proposal-repository'
import { createSqliteScanHistoryRepository } from './sqlite-scan-history-repository'
import { createSqliteSettingsRepository } from './sqlite-settings-repository'

let context: AppContext | null = null

/** Ensambla los adaptadores concretos detras de los puertos del dominio. */
export function getAppContext(): AppContext {
  if (context) return context
  const db = getDatabase()
  const settings = createSqliteSettingsRepository(db)
  const propuestas = createSqliteRepairProposalRepository(db)
  context = {
    projects: createSqliteProjectRepository(db),
    corpus: { of: discoverCorpus },
    fortressConfig: readFortressConfig, huellaDeConfig,
    esRepoPropio: isFortressRepo, // ADR-107
    barrerasDeclaradas: barrerasDeclaradasDelProyecto,
    findings: createSqliteFindingRepository(db),
    fileHistory: createGitFileHistory(), rutaDelControl: createRutaDelControl(), // prettier-ignore
    scans: createSqliteScanHistoryRepository(db), qualityHistory: createSqliteQualityHistoryRepository(db), // prettier-ignore
    repairProposals: propuestas,
    eventLog: createProposalEventLog(createSqliteProposalEventRepository(db), createRepairNotifier(propuestas)), // prettier-ignore
    analystFor: (projectPath, projectId, trusted) => createGraphAnalyst(CLAUDE_BIN, projectPath, projectId, trusted), // prettier-ignore
    headSha, esAncestro: isAncestor, // prettier-ignore
    graphState: createSqliteGraphStateRepository(db),
    chat: createSqliteChatRepository(db),
    runs: createSqliteAgentRunRepository(db),
    paradaRuns: createSqliteParadaRunRepository(db),
    activity: createSqliteActivityRepository(db),
    cognitionWriter: { writeScan }, informeWriter, // prettier-ignore
    omegaLog: createSqliteOmegaLog(db),
    filesystemProbe: createFsProbe(),
    connectors: createSqliteConnectorRepository(db),
    loopSessions: createSqliteLoopSessionRepository(db),
    ...puertosDeAutoMejora(db),
    transaction: (work) => db.transaction(work)(),
    settings,
    apiKeys: createSafeStorageApiKeyStore(settings),
    apiKeyValidator: createAnthropicKeyValidator()
  }
  return context
}
