import type { ChatRepository } from '@domain/chat/chat-repository'
import type { ConnectorRepository } from '@domain/connectors/connector-repository'
import type { LoopSessionRepository } from '@domain/loop/loop-session-repository'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { CapabilityNoteRepository } from '@domain/system/capability-note-repository'
import type { AgentDraftRepository } from '@domain/system/agent-draft-repository'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import type { FileHistory } from '@domain/project/file-history'
import type { FindingRepository } from '@domain/project/finding-repository'
import type { ProjectRepository } from '@domain/project/project-repository'
import type { QualityHistoryRepository } from '@domain/score/quality-record'
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
  /** git: si el archivo de un hallazgo cambio desde que se detecto. */
  readonly fileHistory: FileHistory
  readonly scans: ScanHistoryRepository
  readonly qualityHistory: QualityHistoryRepository
  readonly chat: ChatRepository
  readonly runs: AgentRunRepository
  readonly activity: ActivityRepository
  readonly cognitionWriter: CognitionWriter
  readonly omegaLog: OmegaLog
  readonly filesystemProbe: FilesystemProbe
  readonly connectors: ConnectorRepository
  readonly loopSessions: LoopSessionRepository
  readonly selfObservations: SelfObservationRepository
  readonly capabilities: CapabilityRepository
  readonly capabilityNotes: CapabilityNoteRepository
  readonly agentDrafts: AgentDraftRepository
  readonly capabilityEpisodes: CapabilityEpisodeRepository
  readonly transaction: RunInTransaction
  readonly settings: SettingsRepository
  readonly apiKeys: ApiKeyStore
  readonly apiKeyValidator: ApiKeyValidator
}
