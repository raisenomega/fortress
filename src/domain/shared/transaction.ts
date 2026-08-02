/**
 * Ejecuta varias escrituras como una sola. Existe porque guardar los hallazgos
 * y el score son dos operaciones sobre dos tablas: si solo prospera una, el
 * tablero muestra un score que no corresponde a los hallazgos listados.
 */
export type RunInTransaction = <T>(work: () => T) => T
