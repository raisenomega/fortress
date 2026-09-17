/**
 * El slug con el que codebase-memory-mcp nombra el .db de cada proyecto: la ruta
 * absoluta sin la barra inicial, con las barras Y LOS ESPACIOS en guiones. Los
 * guiones bajos se conservan (`Raisen_FCC` queda igual).
 *
 * Los espacios faltaban, y lo unico que se habia verificado era la ruta que no
 * los tiene. Con ellos dentro, FORTRESS buscaba `…-onn Disk-raisen-nucleo.db` y
 * el fichero era `…-onn-Disk-raisen-nucleo.db`: cuatro de cinco grafos ya
 * indexados se leian como «sin indice», y cada «Instalar grafo» relanzaba una
 * indexacion completa de un repo que ya lo estaba.
 *
 * Derivado de los PARES REALES, no supuesto: cada `.db` guarda su `root_path`,
 * asi que el propio servidor dice con que ruta nombro cada fichero. Ver el test.
 */
export function graphSlug(projectPath: string): string {
  return projectPath.replace(/^\/+/, '').replace(/[\s/]/g, '-')
}
