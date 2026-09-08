import { DESEMPATES } from './desempate-de-tipos'
import { DEFECTOS } from './tipo-de-defecto'

/**
 * El vocabulario tal y como lo lee el escaner: cada tipo con su definicion, y
 * debajo las reglas de desempate.
 *
 * Se EMITE desde `DEFECTOS`, no se copia: si alguien anade un tipo y olvida el
 * prompt, el tipo seria inelegible y el defecto caeria a `otro` — exactamente
 * el modo de fallo que este bloque viene a cerrar.
 */
export const BLOQUE_DE_TIPOS = [
  ...Object.entries(DEFECTOS).map(([tipo, definicion]) => `  · ${tipo}: ${definicion}`),
  '',
  '  Cuando dos tipos parezcan encajar, desempata asi:',
  ...DESEMPATES.map((regla) => `  · ${regla}`)
].join('\n')
