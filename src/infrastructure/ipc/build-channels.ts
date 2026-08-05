/**
 * Canales del subsistema de construccion (build:*), aparte para que crezcan sin
 * apretar channels.ts. Se fusionan en IPC con un spread.
 */
export const BUILD_CHANNELS = {
  buildPlan: 'build:plan',
  buildFeature: 'build:feature'
} as const
