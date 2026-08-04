import type { FileProbe } from './finding-check'

/**
 * Puerto: lo implementa la infraestructura leyendo el disco (solo lectura).
 * El dominio no sabe de `fs`; solo pregunta "existe este archivo del proyecto?".
 */
export interface FilesystemProbe {
  probe(projectPath: string, relativeFile: string): FileProbe
}
