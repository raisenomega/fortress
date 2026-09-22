import { PUENTE, SOCKET_EN_LA_CAJA } from '@domain/sandbox/flags-de-bwrap'

const PUERTO = new URL(PUENTE).port

/**
 * El puente DENTRO de la caja: `socat` escucha en el loopback de la caja (que
 * bwrap levanta solo) y pasa cada conexion al socket UNIX del proxy, que entra
 * en solo lectura. `npm` sale por `HTTPS_PROXY` hacia ese puerto y el proxy, ya
 * FUERA, decide con la tabla cerrada.
 *
 * Es un `sh -c` FIJO —texto nuestro, y nada del proyecto dentro—: el comando y
 * sus argumentos viajan como parametros posicionales (`"$0" "$@"`), nunca
 * interpolados. Se espera a que el puerto conteste antes de arrancar el
 * comando, y `exec` deja al comando en el sitio del shell. Cuando acaba, bwrap
 * —PID 1 de la caja— sale, y el kernel se lleva a `socat` con el.
 */
const SH =
  `socat TCP-LISTEN:${PUERTO},bind=127.0.0.1,reuseaddr,fork UNIX-CONNECT:${SOCKET_EN_LA_CAJA} & ` +
  `i=0; while [ $i -lt 50 ] && ! socat -u /dev/null TCP:127.0.0.1:${PUERTO},connect-timeout=1 2>/dev/null; do i=$((i+1)); sleep 0.05; done; ` +
  'exec "$0" "$@"'

export const conPuente = (bin: string, args: readonly string[]): readonly string[] => [
  '/bin/sh',
  '-c',
  SH,
  bin,
  ...args
]
