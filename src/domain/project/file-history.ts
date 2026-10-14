/**
 * Puerto para preguntarle a git si el archivo de un hallazgo cambio desde una
 * fecha. Git es la unica fuente de verdad sobre si alguien toco el codigo.
 *
 * Nacio como la segunda prueba de la extincion por ausencia, que ya no existe:
 * un escaneo no cierra nada. Hoy su unico consumidor es la marca de MITIGADO,
 * que se conserva mientras el archivo no se mueva (`conservar-mitigado`). La
 * ventana-por-foco del verify ya NO vive aqui: la lleva `RutaDelControl` por
 * conectividad de imports, no por `fix(<id>)`.
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
}
