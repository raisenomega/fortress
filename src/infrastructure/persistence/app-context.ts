import type { AppContext } from '@application/context'
import { createAnthropicKeyValidator } from '../ai/anthropic-key-validator'
import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createSafeStorageApiKeyStore } from '../security/api-key-store'
import { getDatabase } from './database'
import { writeScan } from '../cognition/write-cognition-log'
import { createGitFileHistory } from '../git/file-history'
import { headSha } from '../git/head-sha'
import { createFsProbe } from '../omega/fs-probe'
import { createGraphAnalyst } from '../repair/graph-analyst'
import { createSqliteActivityRepository } from './sqlite-activity-repository'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import { createSqliteChatRepository } from './sqlite-chat-repository'
import { createSqliteConnectorRepository } from './sqlite-connector-repository'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import { createSqliteLoopSessionRepository } from './sqlite-loop-session-repository'
import { createSqliteCapabilityRepository } from './sqlite-capability-repository'
import { createSqliteCapabilityNoteRepository } from './sqlite-capability-note-repository'
import { createSqliteAgentDraftRepository } from './sqlite-agent-draft-repository'
import { createSqliteCapabilityEpisodeRepository } from './sqlite-capability-episode-repository'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
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
    findings: createSqliteFindingRepository(db),
    fileHistory: createGitFileHistory(),
    scans: createSqliteScanHistoryRepository(db),
    qualityHistory: createSqliteQualityHistoryRepository(db),
    repairProposals: propuestas,
    eventLog: createProposalEventLog(createSqliteProposalEventRepository(db), createRepairNotifier(propuestas)), // prettier-ignore
    analystFor: (projectPath) => createGraphAnalyst(CLAUDE_BIN, projectPath),
    headSha,
    graphState: createSqliteGraphStateRepository(db),
    chat: createSqliteChatRepository(db),
    runs: createSqliteAgentRunRepository(db),
    activity: createSqliteActivityRepository(db),
    cognitionWriter: { writeScan },
    omegaLog: createSqliteOmegaLog(db),
    filesystemProbe: createFsProbe(),
    connectors: createSqliteConnectorRepository(db),
    loopSessions: createSqliteLoopSessionRepository(db),
    selfObservations: createSqliteSelfObservationRepository(db),
    capabilities: createSqliteCapabilityRepository(db),
    capabilityNotes: createSqliteCapabilityNoteRepository(db),
    agentDrafts: createSqliteAgentDraftRepository(db),
    capabilityEpisodes: createSqliteCapabilityEpisodeRepository(db),
    transaction: (work) => db.transaction(work)(),
    settings,
    apiKeys: createSafeStorageApiKeyStore(settings),
    apiKeyValidator: createAnthropicKeyValidator()
  }
  return context
}
