/**
 * El slug con el que codebase-memory-mcp nombra el .db de cada proyecto: la ruta
 * absoluta sin la barra inicial y con las barras convertidas en guiones. Los
 * guiones bajos se conservan (Raisen_FCC queda igual). Verificado contra el .db
 * real: /home/jojo/.../fortress-command-center -> home-jojo-...-command-center.
 */
export function graphSlug(projectPath: string): string {
  return projectPath.replace(/^\/+/, '').replace(/\//g, '-')
}
