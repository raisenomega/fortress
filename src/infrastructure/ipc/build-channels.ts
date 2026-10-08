/**
 * Canales del subsistema de construccion (build:*), aparte para que crezcan sin
 * apretar channels.ts. Se fusionan en IPC con un spread.
 */
export const BUILD_CHANNELS = {
  buildPlan: 'build:plan',
  buildInvestigate: 'build:investigate',
  buildLibre: 'build:libre',
  buildFeature: 'build:feature',
  buildStop: 'build:stop',
  buildPickFile: 'build:pick-file'
} as const
