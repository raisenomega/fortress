import type { Caja } from './flags-de-bwrap'

/** Una caja como la de la maquina donde se midio: /usr fusionado y node en nvm. */
export const caja = (over: Partial<Caja> = {}): Caja => ({
  proyecto: '/home/ana/proyectos/tienda',
  cwd: '/home/ana/proyectos/tienda',
  home: '/home/ana',
  sistema: [
    { ruta: '/usr', enlaceA: null },
    { ruta: '/bin', enlaceA: 'usr/bin' }
  ],
  soloLectura: ['/home/ana/.nvm/versions/node/v24.18.0'],
  escritura: [],
  socketDelProxy: null,
  ...over
})

/** El indice del primer flag `nombre` cuyo argumento siguiente es `ruta`. */
export const donde = (flags: readonly string[], nombre: string, ruta: string): number =>
  flags.findIndex((f, i) => f === nombre && flags[i + 1] === ruta)
