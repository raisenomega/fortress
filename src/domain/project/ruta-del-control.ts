/**
 * La RUTA del control de un hallazgo: donde vive de verdad el arreglo, probado
 * por CONECTIVIDAD DE IMPORTS —no por el nombre del commit (`fix(<id>)`) ni por
 * mirar solo el ancla—. Reemplaza la ventana-por-foco de INC-A/P1/P2: un control
 * pudo mudarse a un hermano (el llamador que envuelve, el gate que exige) y aun
 * asi estar EN LA RUTA del hallazgo, invisible a `--grep=fix(<id>)`.
 *
 * Honestidad dura: un marcador que casa el texto en un fichero NO conectado al
 * ancla (el mismo `if (!ejecutaConConfianza)` en `install-graph`, otra capa) NO
 * cuenta. Solo presencia en HEAD + atribucion (lo introdujo un commit) +
 * conectividad al ancla + UNICO cierran. 0 o ambiguo → conserva, nunca false-close.
 */
export interface RutaDelControl {
  /**
   * Ficheros bajo `src/` (sin tests ni fixtures) que CONTIENEN `marcador` en HEAD
   * y donde fue INTRODUCIDO (pickaxe `-S` no vacio): el control, presente y
   * atribuido. Vacio si no hay ninguno, el marcador es vacio o git falla.
   */
  controlesEnHead(projectPath: string, marcador: string): Promise<readonly string[]>

  /**
   * true si `file` esta en la ruta de imports del hallazgo anclado en `ancla`: el
   * cierre de imports (BFS acotado) de UNO alcanza al OTRO —el control importa al
   * ancla, o el ancla lo importa transitivamente—. Conservador: una arista que no
   * resuelve no se sigue, asi que nunca sobre-conecta → nunca false-close.
   */
  enRuta(projectPath: string, ancla: string, file: string): boolean

  /**
   * Borra la cache del grafo de imports. Se llama al EMPEZAR una corrida de
   * verify: el grafo se cachea POR CORRIDA (no por hallazgo, para que la escala
   * no se arrastre) pero no debe sobrevivir a un arbol que cambio entre corridas.
   */
  olvidar(): void
}
