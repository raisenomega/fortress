/**
 * La QUINTA familia del criterio innegociable: lo que mantiene al prompt
 * diciendo la verdad. El prompt no AFIRMA capacidades: las REFLEJA de una
 * fuente —los args con que se lanza, lo que el servidor del grafo expone, lo que
 * el descubridor de corpus busco— y un test derivado por fuente caza la
 * desincronizacion. Un fix que aflojara una fuente o un test volveria a mentirle
 * al agente sin que nadie lo notara: por eso no entra sin firma.
 */
export const DEFENSAS_DEL_PROMPT: readonly string[] = [
  // Las tres fuentes.
  'src/domain/agent/capacidades-del-agente.ts',
  'src/domain/connectors/herramientas-del-grafo.ts',
  'src/domain/settings/docs-first-cabeceras.ts',
  // Lo que el grafo NO ve y lo que el proyecto declara: derivadas de una medida (ADR-104).
  'src/domain/settings/lo-que-el-grafo-no-ve.ts',
  'src/domain/project/barreras-declaradas.ts',
  // Los tests derivados que cazan la desincronizacion, para que un fix no los afloje.
  'src/infrastructure/repair/prompt-refleja-los-args.test.ts',
  'src/domain/connectors/herramientas-del-grafo.test.ts',
  'src/infrastructure/graph/grafo-instalado.test.ts',
  // Auto-cobertura.
  'src/domain/repair/innegociables-prompt.ts'
]
