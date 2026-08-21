import type { AppContext } from '@application/context'
import type { Db } from './database'
import { createSqliteAgentDraftRepository } from './sqlite-agent-draft-repository'
import { createSqliteCapabilityEpisodeRepository } from './sqlite-capability-episode-repository'
import { createSqliteCapabilityNoteRepository } from './sqlite-capability-note-repository'
import { createSqliteCapabilityRepository } from './sqlite-capability-repository'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

type PuertosAutoMejora = Pick<
  AppContext,
  'selfObservations' | 'capabilities' | 'capabilityNotes' | 'agentDrafts' | 'capabilityEpisodes'
>

/** Los cinco puertos con los que FORTRESS se observa y se propone a si misma.
 *  Salieron del ensamblador general cuando este toco el limite de 75 lineas:
 *  son una familia, y se montan juntos o no se montan. */
export function puertosDeAutoMejora(db: Db): PuertosAutoMejora {
  return {
    selfObservations: createSqliteSelfObservationRepository(db),
    capabilities: createSqliteCapabilityRepository(db),
    capabilityNotes: createSqliteCapabilityNoteRepository(db),
    agentDrafts: createSqliteAgentDraftRepository(db),
    capabilityEpisodes: createSqliteCapabilityEpisodeRepository(db)
  }
}
