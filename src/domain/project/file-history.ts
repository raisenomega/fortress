/**
 * Puerto de la SEGUNDA prueba de la extincion: que el archivo de un hallazgo
 * haya cambiado desde que se detecto. Lo responde git, que es la unica fuente
 * de verdad sobre si alguien toco el codigo.
 */
export interface FileHistory {
  /**
   * true si `file` cambio en el repositorio de `projectPath` desde `since`
   * (fecha ISO).
   *
   * Ante cualquier duda —no es un repo git, el archivo nunca existio, git
   * falla— devuelve **false**. Un false conserva el hallazgo; un true lo
   * extingue. Equivocarse conservando cuesta un hallazgo de mas en la lista;
   * equivocarse extinguiendo borra un problema real del registro.
   */
  changedSince(projectPath: string, file: string, since: string): Promise<boolean>
}
