/**
 * La familia de la LEY DE AISLAMIENTO del Superagente (Sello B.1, vision §5):
 * un turno de CTO anclado a B jamas ve el libro de vida de A. El ensamblador
 * es quien la cumple (UN projectId, resolveTarget, eventos solo via las
 * propuestas del proyecto); sus guardianes son el test sagrado de custodia
 * A/B, los pines del camino y la fixture que siembra a A entero al lado —
 * quitarle a la fixture el sembrado de A dejaria la custodia pasando en
 * falso: debilitar al guardian es debilitar la ley. Nacieron firmados por
 * Jojo el 2026-10-09 y no se tocan sin su firma.
 */
export const DEFENSAS_DEL_AISLAMIENTO: readonly string[] = [
  // El ensamblador: la pared.
  'src/infrastructure/build/rebanada-del-libro.ts',
  // Los guardianes: la custodia A/B, los pines del camino y la siembra de A.
  'src/infrastructure/build/rebanada-del-libro.test.ts',
  'src/infrastructure/build/rebanada-anclada.test.ts',
  'src/infrastructure/build/rebanada-fixture.ts',
  // Auto-cobertura.
  'src/domain/repair/innegociables-aislamiento.ts'
]
