import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Los TRES artefactos publicos que el `npm ci` del gate necesita ver (ADR-108).
 * Sin ellos muere dentro de la caja: 99 de 99 verdes antes del 21-sep, 0 de 3
 * despues (DEUDAS §11.1). Son dos fallos distintos, y el segundo solo aparecio
 * al probar el `npm ci` COMPLETO:
 *
 *  1. Las CABECERAS de Node y Electron. Sin ellas `node-gyp configure` sale a
 *     descargarlas y el proxy lo niega.
 *  2. El BINARIO de Electron. El paquete `electron` lo baja en su propio
 *     `install.js` desde github.com —que la tabla del proxy no abre— y con el
 *     HOME tapado no ve la cache donde el zip YA ESTA. Medido: con solo las
 *     cabeceras, `npm ci` muere en `getaddrinfo ENOTFOUND github.com`; con las
 *     tres, pasa en 28 s sin red.
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
 * `installVersion` y UN zip de release. Cero enlaces simbolicos. Artefactos
 * publicos, identicos para cualquiera que instale esas versiones: ni un dato del
 * operador, ni de un cliente, ni de otro cliente.
 *
 * Lo que NO resuelven: un salto de MAJOR del ABI. Si la version destino no esta
 * en la cache del HOST, `node-gyp` falla en el `mkdir` del devdir en solo
 * lectura, antes de intentar la red. Eso queda fuera del Motor por decision
 * firmada (ADR-108 §3.5).
 */
export const ARTEFACTOS_PUBLICOS: readonly string[] = [
  join(homedir(), '.electron-gyp'),
  join(homedir(), '.cache', 'node-gyp'),
  join(homedir(), '.cache', 'electron')
]
