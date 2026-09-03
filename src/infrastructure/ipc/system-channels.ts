/**
 * Canales del subsistema de auto-mejora (system:*), aparte para que crezcan sin
 * apretar channels.ts. Se fusionan en IPC con un spread.
 */
export const SYSTEM_CHANNELS = {
  systemObservations: 'system:observations',
  systemExportObservations: 'system:export-observations',
  systemImportAttended: 'system:import-attended',
  systemResolveObservation: 'system:resolve-observation',
  systemCapabilities: 'system:capabilities',
  systemProposeCapability: 'system:propose-capability',
  systemPromoteCapability: 'system:promote-capability',
  systemCapabilityNotes: 'system:capability-notes',
  systemAddCapabilityNote: 'system:add-capability-note',
  systemAgentDraft: 'system:agent-draft',
  systemSetAgentDraft: 'system:set-agent-draft',
  systemActivateAgent: 'system:activate-agent',
  systemDeactivateAgent: 'system:deactivate-agent',
  systemDraftAgentAuto: 'system:draft-agent-auto',
  systemRunEpisode: 'system:run-episode',
  systemGenesisToggle: 'system:genesis-toggle',
  systemGenesisStatus: 'system:genesis-status'
} as const
