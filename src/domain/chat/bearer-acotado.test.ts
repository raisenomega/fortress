import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/** El primo del PASO 69 dentro de un valor: `Bearer\s+\S+` se comia la comilla
 *  de cierre y dejaba el JSON invalido. Acotado a no-comillas, el documento
 *  sobrevive y el token muere igual. */
describe('el Bearer no se come la comilla', () => {
  it('{"authorization":"Bearer x"} queda tachado Y re-parsea', () => {
    const salida = redactSecrets('{"authorization":"Bearer abc12345","next":"y"}')
    expect(salida).not.toContain('abc12345')
    expect(() => JSON.parse(salida)).not.toThrow()
    expect((JSON.parse(salida) as { next: string }).next).toBe('y')
  })

  it('candado: el encabezado en PROSA se sigue tachando hasta fin de linea', () => {
    const salida = redactSecrets('Authorization: Bearer abc12345 extra')
    expect(salida).not.toContain('abc12345')
    expect(salida).not.toContain('extra')
  })

  it('candado: un Bearer suelto en prosa sigue cayendo', () => {
    expect(redactSecrets('curl -H X Bearer abc12345 fin')).not.toContain('abc12345')
  })
})
