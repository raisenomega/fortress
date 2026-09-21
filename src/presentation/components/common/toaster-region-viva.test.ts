import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const fuente = (fichero: string): string =>
  readFileSync(join(process.cwd(), 'src/presentation/components/common', fichero), 'utf8')

/**
 * Un lector de pantalla anuncia lo que CAMBIA dentro de una region viva que ya
 * conocia. El Toaster devolvia `null` sin avisos, asi que la region nacia a la
 * vez que su primer aviso y ese aviso llegaba mudo.
 */
describe('los avisos del Toaster se anuncian', () => {
  const toaster = fuente('Toaster.tsx')

  it('la region viva existe tambien cuando no hay avisos', () => {
    expect(toaster).toContain('<div aria-live="polite"')
    // Sobre la FIRMA y no sobre la frase: el docblock nombra el `null` que se
    // quito, y un `not.toMatch` contra la prosa fallaria por el comentario.
    expect(toaster).toContain('export function Toaster(): React.JSX.Element {')
  })

  // `Notice` es `role="status"` por si solo. Una region viva dentro de otra hace
  // que algunos lectores digan el aviso dos veces.
  it('los avisos de dentro no son una segunda region viva', () => {
    expect(toaster).toMatch(/<Notice tone=\{toast\.tone\} callado>/)
    expect(fuente('Notice.tsx')).toContain("role={callado ? undefined : 'status'}")
  })
})
