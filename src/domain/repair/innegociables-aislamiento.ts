/**
 * La familia de la LEY DE AISLAMIENTO del Superagente (Sello B.1, vision §5):
 * un turno de CTO anclado a B jamas ve el libro de vida de A. El ensamblador
 * es quien la cumple (UN projectId, resolveTarget, eventos solo via las
 * propuestas del proyecto); sus guardianes son el test sagrado de custodia
 * A/B, los pines del camino y la fixture que siembra a A entero al lado —
 * quitarle a la fixture el sembrado de A dejaria la custodia pasando en
 * falso: debilitar al guardian es debilitar la ley. Nacieron firmados por
 * Jojo el 2026-10-09 y no se tocan sin su firma.
 *
 * PASO 142 (firma de Jojo): se pliega el guardian de la CABECERA de
 * subordinacion — el pin determinista que afirma que la cabecera precede a
 * TODOS los marcos y lleva sus tres clausulas. Es la defensa de comportamiento
 * que aguanto 10/10; sin su guardian en el registro, un turno podria aflojarla
 * en silencio (quitar el bucle «precede a TODOS», borrar una clausula).
 *
 * PASO 145 (Sello B.2): entran el adaptador del grafo y su runner cli. Son
 * pared de aislamiento: leen de una COPIA fenced (nunca el indice real) y
 * descartan el stderr donde el binario enumera `available_projects`. Aflojar
 * cualquiera —apuntar al cache real, fusionar stderr— abriria el leak del 144.
 *
 * PASO 160 (Sello B.4): el radio de impacto (trace_path) sobre el MISMO fence.
 * El orquestador abre UN solo .db por turno (overview + impacto lo comparten);
 * el adaptador de impacto corre dentro de `dir`, nunca el cache real; y su
 * parser rechaza el `{"error":...}` que enumera `available_projects`. Abrir un
 * 2o .db, apuntar al cache real o armar impacto del error reabriria el leak.
 */
export const DEFENSAS_DEL_AISLAMIENTO: readonly string[] = [
  // El ensamblador: la pared.
  'src/infrastructure/build/rebanada-del-libro.ts',
  // Los guardianes: la custodia A/B, los pines del camino y la siembra de A.
  'src/infrastructure/build/rebanada-del-libro.test.ts',
  'src/infrastructure/build/rebanada-anclada.test.ts',
  'src/infrastructure/build/grafo-anclado.test.ts',
  'src/infrastructure/build/rebanada-fixture.ts',
  // El guardian de la cabecera de subordinacion (PASO 142).
  'src/infrastructure/build/run-cto-rebanada.test.ts',
  // El grafo del proyecto anclado (Sello B.2): el adaptador fenced + su runner.
  'src/infrastructure/graph/leer-overview-del-grafo.ts',
  'src/infrastructure/graph/correr-cli-grafo.ts',
  // El radio de impacto (Sello B.4): el fence unico, el adaptador y su parser.
  'src/infrastructure/graph/leer-grafo-del-turno.ts',
  'src/infrastructure/graph/leer-impacto-del-grafo.ts',
  'src/infrastructure/graph/impacto-crudo.ts',
  // Auto-cobertura.
  'src/domain/repair/innegociables-aislamiento.ts'
]
