import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/** El mordisco del PASO 69: el `-u` DE `connector-url.ts` casaba como un
 *  `curl -u`, y el valor se desbocaba por el JSON compacto hasta el primer
 *  espacio — se comio la linea, el cierre de la entrada y el titulo siguiente
 *  en 5 de 13 scan-logs persistidos. */
describe('la bandera -u exige la frontera real de curl', () => {
  it('candado: el curl -u real se SIGUE tachando — cero fuga nueva', () => {
    expect(redactSecrets('curl -u admin:supersecreta https://x')).toBe('curl -u admin:*** https://x') // prettier-ignore
    // curl tambien admite el valor PEGADO a la bandera.
    expect(redactSecrets('curl -uadmin:supersecreta https://x')).toBe('curl -uadmin:*** https://x') // prettier-ignore
  })

  it('una cita fichero:linea con -u dentro del nombre queda INTACTA', () => {
    const cita = 'el fallo vive en connector-url.ts:57 y se arregla alli'
    expect(redactSecrets(cita)).toBe(cita)
  })

  it('el span real de 74af9562 ya no se muerde: el JSON sobrevive entero', () => {
    const span = '"file":"src/domain/connectors/connector-url.ts","line":57,"tipo":"secret-in-argv"},{"severity":"LOW","title":"La config"' // prettier-ignore
    expect(redactSecrets(span)).toBe(span)
  })
})
