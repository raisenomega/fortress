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

  /**
   * El sha BASE del trabajo enfocado en `findingId`: el PADRE del commit durable
   * mas antiguo cuyo asunto empieza por `fix(<findingId>)` —los que escribe la
   * correa del lazo (A-4)—. Asi la ventana de la puerta abarca TODOS los turnos
   * del fix de ese hallazgo, no solo el del verify: un DROP committeado dos
   * turnos antes sigue contando como "tocado por el arreglo".
   *
   * `null` si aun no hay commit del fix (el arreglo del turno sigue sin commitear
   * y la base del turno ya lo ve), si el commit es raiz sin padre, o si git falla.
   * Quien lee cae entonces a la base del turno (HEAD) — cero regresion.
   */
  baseDelFoco(projectPath: string, findingId: string): Promise<string | null>

  /**
   * Ficheros del fix de `findingId` (ventana del foco) cuyas ADICIONES contienen
   * `marcador` —nacio CON el arreglo, no preexistia—. Sirve para inferir el
   * fichero de la evidencia cuando el analista lo omitio (P2). Vacio si no hay
   * base del foco, el marcador es vacio o git falla.
   */
  ficherosConMarcadorNacido(projectPath: string, findingId: string, marcador: string): Promise<readonly string[]>
}
