/**
 * Los canales de la telemetria, en su propio grupo como los otros seis. Salen de
 * `channels.ts` porque ahi ya no cabian, y agrupados se lee de un vistazo que la
 * medida y lo que NO se pudo medir viajan por canales distintos: mezclarlos en
 * uno invitaria a sumarlos, y el punto es justamente que no se suman.
 */
export const TELEMETRY_CHANNELS = {
  telemetrySession: 'telemetry:session',
  telemetryBilling: 'telemetry:billing',
  telemetryAverage: 'telemetry:average',
  telemetrySince: 'telemetry:since',
  telemetryByProject: 'telemetry:by-project',
  telemetrySinFactura: 'telemetry:sin-factura',
  telemetryRanking: 'telemetry:ranking'
} as const
