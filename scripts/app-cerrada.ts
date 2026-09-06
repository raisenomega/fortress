import { spawnSync } from 'child_process'

const sh = (comando: string): string => spawnSync('bash', ['-c', comando]).stdout.toString().trim()

/**
 * La app viva NO es negociable: escribir su base por debajo es como reemplazar el
 * AppImage en caliente — la doctrina del rebuild en frio, aplicada a los datos.
 *
 * Cuatro caminos, porque ninguno basta solo: `pgrep -x` por nombre EXACTO (`-f`
 * se auto-matchea con este mismo proceso y da un falso positivo), el mount de
 * FUSE, el nombre en `ps` y el directorio de montaje del AppImage. Y NUNCA
 * `pgrep electron`, que no distingue esta app de cualquier otra Electron.
 *
 * Se llama pegado a la escritura, no al arrancar: entre comprobar y escribir el
 * mundo cambia, y una foto vieja no es una garantia.
 */
export function appCerrada(): boolean {
  return (
    spawnSync('pgrep', ['-x', 'fortress']).status !== 0 &&
    sh('mount 2>/dev/null | grep -c fuse.fortress') === '0' &&
    sh('ps -e -o comm= | grep -ic fortress') === '0' &&
    sh('ls -d /tmp/.mount_fortre* 2>/dev/null | wc -l') === '0'
  )
}
