import type { ChatRepository } from '@domain/chat/chat-repository'
import type { ConnectorRepository } from '@domain/connectors/connector-repository'
import type { LoopSessionRepository } from '@domain/loop/loop-session-repository'
import type { FindingRepository } from '@domain/project/finding-repository'
import type { ProjectRepository } from '@domain/project/project-repository'
import type { ScanHistoryRepository } from '@domain/scan/scan-record'
import type { ApiKeyStore, ApiKeyValidator } from '@domain/settings/api-key-store'
import type { SettingsRepository } from '@domain/settings/settings-repository'
import type { CognitionWriter } from '@domain/cognition/cognition-writer'
import type { FilesystemProbe } from '@domain/omega/filesystem-probe'
import type { OmegaLog } from '@domain/omega/omega-log'
import type { ActivityRepository } from '@domain/telemetry/activity'
import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'
import type { RunInTransaction } from '@domain/shared/transaction'

/**
 * Puertos que necesitan los casos de uso. La aplicacion solo conoce estas
 * interfaces; quien las implementa (SQLite, Anthropic, safeStorage) es cosa
 * de la infraestructura.
 */
export interface AppContext {
  readonly projects: ProjectRepository
  readonly findings: FindingRepository
  readonly scans: ScanHistoryRepository
  readonly chat: ChatRepository
  readonly runs: AgentRunRepository
  readonly activity: ActivityRepository
  readonly cognitionWriter: CognitionWriter
  readonly omegaLog: OmegaLog
  readonly filesystemProbe: FilesystemProbe
  readonly connectors: ConnectorRepository
  readonly loopSessions: LoopSessionRepository
  readonly transaction: RunInTransaction
  readonly settings: SettingsRepository
  readonly apiKeys: ApiKeyStore
  readonly apiKeyValidator: ApiKeyValidator
}
