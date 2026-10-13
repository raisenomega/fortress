/**
 * Puerto para preguntarle a git si el archivo de un hallazgo cambio desde una
 * fecha. Git es la unica fuente de verdad sobre si alguien toco el codigo.
 *
 * Nacio como la segunda prueba de la extincion por ausencia, que ya no existe:
 * un escaneo no cierra nada. Hoy su unico consumidor es la marca de MITIGADO,
 * que se conserva mientras el archivo no se mueva.
 */
export interface FileHistory {
  /**
   * true si `file` cambio en el repositorio de `projectPath` desde `since`
   * (fecha ISO).
   *
   * Ante cualquier duda —no es un repo git, el archivo nunca existio, git
   * falla— devuelve **false**, que es el lado conservador de su unico sitio: un
   * false CONSERVA la marca de mitigado, porque sin evidencia no se deshace una
   * decision que alguien tomo a proposito.
   */
  changedSince(projectPath: string, file: string, since: string): Promise<boolean>

  /**
   * true si `file` lo toco el arreglo del turno: aparece en el diff entre
   * `desdeSha` (el inicio del turno) y el arbol de hoy. Vale committeado o no,
   * por eso compara contra una revision y no contra HEAD —robusto al orden
   * verify/commit del lazo—.
   *
   * Mismo lado conservador que `changedSince`: no es repo, git falla, la ruta no
   * existe o no la toco nada → **false**. Un false NO cierra el hallazgo; la
   * prueba de extincion citada contra un fichero ajeno se descarta y la fila
   * sigue mitigada (ADR-065). La ruta la elige un agente: tratar la duda como
   * "si lo toco" seria permiso para cerrar citando cualquier fichero.
   */
  tocadoPorElArreglo(projectPath: string, file: string, desdeSha: string): Promise<boolean>
}
