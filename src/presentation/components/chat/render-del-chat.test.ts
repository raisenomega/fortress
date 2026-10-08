import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** PASO 94: la salida del agente se pinta con el Markdown CASERO (nodos React,
 *  jamas HTML crudo) en las dos vistas. El texto que entra ya viene tachado. */

const fuente = (r: string): string => readFileSync(r, 'utf8')

describe('el chat pinta markdown con el renderizador de la casa', () => {
  it('el Terminal y el construir renderizan la respuesta con <Markdown', () => {
    expect(fuente('src/presentation/components/chat/TerminalMessage.tsx')).toContain('<Markdown')
    expect(fuente('src/presentation/components/construir/MensajeDelConstruir.tsx')).toContain('<Markdown') // prettier-ignore
    expect(fuente('src/presentation/components/construir/ConstruirMessages.tsx')).toContain('MensajeDelConstruir') // prettier-ignore
  })

  it('el borrador EN VIVO del construir conserva la actividad coloreada (84)', () => {
    expect(fuente('src/presentation/components/construir/ConstruirMessages.tsx')).toContain('LineaDelBorrador') // prettier-ignore
  })
})

describe('el candado XSS, pineado sobre TODA presentation', () => {
  it('ningun fichero usa dangerouslySetInnerHTML (el markdown es nodos React)', () => {
    const sospechosos: string[] = []
    const camina = (dir: string): void => {
      for (const f of readdirSync(dir)) {
        const ruta = join(dir, f)
        if (statSync(ruta).isDirectory()) camina(ruta)
        else if (/\.(ts|tsx)$/.test(f) && fuente(ruta).includes('dangerouslySetInnerHTML')) {
          // El comentario-doctrina de markdown-inline lo NOMBRA para prohibirlo.
          if (!fuente(ruta).includes('* dangerouslySetInnerHTML')) sospechosos.push(ruta)
        }
      }
    }
    camina('src/presentation')
    expect(sospechosos).toEqual([])
  })
})
