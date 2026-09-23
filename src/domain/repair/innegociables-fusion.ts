/**
 * La SEXTA familia del criterio innegociable: la FUSION y el backfill de
 * identidades (ADR-071, ADR-084, ADR-087). Es el momento mas irreversible del
 * sistema —una absorbida se marca EXTINCT y de ahi no vuelve, y un hallazgo
 * extinguido sin prueba es un agujero que nadie mira— y sus guardas son
 * exactamente lo que un fix podria aflojar sin que nadie lo notara: el selector
 * que decide QUE filas entran, la comprobacion del marcador antes de extinguir,
 * y la red de invariantes que deshace la transaccion si algo no cuadra.
 */
export const DEFENSAS_DE_LA_FUSION: readonly string[] = [
  'src/domain/project/fusion-de-duplicados.ts',
  'src/domain/project/gemela-de-la-zombi.ts',
  'src/domain/project/reclasificacion-de-zombis.ts',
  'src/domain/project/veredictos-del-lote.ts',
  'src/domain/project/fusiones-del-paso-b.ts',
  'src/domain/project/retipado-de-otros.ts',
  'src/domain/project/fusiones-del-retipado.ts',
  'src/domain/project/fusion-por-juicio.ts',
  'src/domain/project/pares-candidatos.ts',
  'src/domain/project/veredictos-de-pares.ts',
  'src/domain/repair/leer-mismo-defecto.ts',
  'src/application/repair/fundir-por-juicio.ts',
  'src/domain/repair/evidencia-obsolescencia.ts',
  'src/infrastructure/persistence/filas-con-identidad-vieja.ts',
  'src/infrastructure/persistence/zombis-sin-gemela.ts',
  'src/infrastructure/persistence/filas-otro.ts',
  'src/infrastructure/persistence/finding-fusion-sql.ts',
  'src/infrastructure/persistence/fundir-en-caliente.ts',
  'src/infrastructure/persistence/finding-writes.ts',
  'src/infrastructure/persistence/finding-alias-sql.ts',
  'src/infrastructure/persistence/finding-alias-writes.ts',
  'src/infrastructure/persistence/finding-fusion-por-juicio.ts',
  'src/infrastructure/persistence/red-de-la-fusion.ts',
  'src/infrastructure/persistence/red-de-la-fusion-marcas.ts',
  // Auto-cobertura.
  'src/domain/repair/innegociables-fusion.ts'
]
