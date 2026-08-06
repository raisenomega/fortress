import type { HealthReport } from '@domain/health/health-check'
import type { ActivityApi, PushApi, ScanApi } from './scan-api'
import type { BuildApi } from './build-api'
import type { ChatApi, ProjectsApi, SettingsApi } from './core-apis'
import type { ConnectorsApi } from './connectors-api'
import type { OmegaApi } from './omega-api'
import type { SelfImprovementApi } from './self-improvement-api'
import type {
  AccountApi,
  PostureApi,
  CognitionApi,
  GraphApi,
  MaintenanceApi,
  NewProjectApi,
  TelemetryApi
} from './system-api'

/** Cancela la suscripcion a los fragmentos del streaming. */
export type Unsubscribe = () => void

/**
 * Contrato del puente main <-> renderer. Solo tipos, sin runtime: el renderer
 * puede importarlo sin arrastrar nada del proceso principal.
 */
export interface FortressApi {
  readonly projects: ProjectsApi
  readonly chat: ChatApi
  readonly health: {
    run(): Promise<HealthReport>
  }
  readonly omega: OmegaApi
  readonly system: SelfImprovementApi
  readonly build: BuildApi
  readonly scan: ScanApi
  readonly activity: ActivityApi
  readonly telemetry: TelemetryApi
  readonly account: AccountApi
  readonly posture: PostureApi
  readonly connectors: ConnectorsApi
  readonly cognition: CognitionApi
  readonly graph: GraphApi
  readonly maintenance: MaintenanceApi
  readonly newProject: NewProjectApi
  readonly push: PushApi
  readonly settings: SettingsApi
}
