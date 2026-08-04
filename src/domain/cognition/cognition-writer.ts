/**
 * Puerto para escribir la memoria del proyecto. La infraestructura toca el
 * disco; la aplicacion solo pide "registra esta reflexion".
 */
export interface CognitionWriter {
  appendReflection(projectPath: string, projectName: string, entry: string): void
}
