import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Las cabeceras publicas de Node y Electron (ADR-108). Sin ellas `node-gyp
 * configure` sale a descargarlas, el proxy lo niega y el `npm ci` del gate
 * muere: 99 de 99 verdes antes de la caja, 0 de 3 despues (DEUDAS §11.1).
 *
 * LOS DIRECTORIOS PADRE, NUNCA `<padre>/<version>`. Montar por version
 * obligaria a sacar la version de algun sitio, y el sitio natural seria el
 * `package.json` del proyecto: un dato que el repo AUDITADO controla, entrando
 * en la lista de montajes de la caja. Es la forma exacta del error que costo la
 * trifecta del aislamiento, y los padres lo evitan gratis porque no piden
 * ninguna entrada.
 *
 * SOLO LECTURA, y esa es la casilla que importa: la clase B corre tambien sobre
 * repos de CLIENTE, y con montaje escribible un proceso de la caja de un cliente
 * envenenaria la cache REAL del operador, que despues compila el modulo nativo
 * de FORTRESS. Entran por `soloLectura`, nunca por `escritura`.
 *
 * Contenido medido el 2026-09-30: 2846 ficheros `.h`, 4 `.gypi`, 2
 * `installVersion`, cero enlaces simbolicos. Artefactos publicos: ni un dato del
 * operador, ni de un cliente, ni de otro cliente.
 */
export const CABECERAS_PUBLICAS: readonly string[] = [
  join(homedir(), '.electron-gyp'),
  join(homedir(), '.cache', 'node-gyp')
]
