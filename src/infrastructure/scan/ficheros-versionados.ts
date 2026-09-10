import { runCommand } from '../probe/run-command'

/**
 * Lo que git tiene versionado, en rutas relativas a la raiz del proyecto.
 *
 * `git ls-files` y no un recorrido del disco, por tres razones que apuntan al
 * mismo sitio: da rutas relativas ya listas para agrupar, hereda el
 * `.gitignore` del proyecto sin escribir una linea —fuera `out/`, `dist/`,
 * `node_modules/`— y solo devuelve lo VERSIONADO, que es exactamente lo que un
 * escaneo tiene que auditar. `listFiles` de la Capa 3 esta para otra cosa:
 * comparar el arbol entero byte a byte, donde si hace falta ver hasta lo que
 * git ignora.
 *
 * Vive aparte desde que hay DOS lecturas sobre la misma salida —la fuente que
 * cuenta las paradas y las senales que delatan modulos (ADR-083)—: el comando
 * es uno y los filtros son dos, y separarlos aqui impide que la segunda lectura
 * se invente otra enumeracion.
 *
 * Sin ficheros no se distingue un proyecto vacio de un `git ls-files` que
 * fallo, y no hace falta: las dos cosas dan un manifiesto vacio, y un escaneo
 * sin nada que mirar no tiene paradas que prometer.
 */
export async function ficherosVersionados(projectPath: string): Promise<readonly string[]> {
  const listado = await runCommand('git', ['ls-files'], projectPath)
  return listado.out.split('\n')
}
