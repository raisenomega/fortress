import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { MAX_LINEAS_POR_FICHERO, cuentaLineas } from '@domain/shared/limite-de-fichero'

/**
 * El numero vive en dos sitios —el dominio no lee ficheros de configuracion— y
 * un duplicado sin vigilancia envejece. Esta prueba es la vigilancia: si alguien
 * mueve el tope en ESLint y no en el dominio, el cerco seguiria integrando con
 * el numero viejo y main volveria a ponerse rojo por la misma puerta.
 */
function topeDeEslint(): number {
  const config = readFileSync(join(process.cwd(), 'eslint.config.mjs'), 'utf8')
  const linea = /'max-lines':\s*\['error',\s*\{\s*max:\s*(\d+)/.exec(config)
  if (linea === null) throw new Error('eslint.config.mjs ya no declara max-lines asi')
  return Number(linea[1])
}

describe('el tope de lineas: un solo numero en dos ficheros', () => {
  it('la constante del dominio es la que ESLint verifica', () => {
    expect(MAX_LINEAS_POR_FICHERO).toBe(topeDeEslint())
  })

  it('todos los bloques de eslint.config.mjs declaran el MISMO tope', () => {
    // Hay dos: el general y el de los tests. Si divergen, el cerco no puede
    // decidir con un solo numero y esta prueba deja de significar nada.
    const config = readFileSync(join(process.cwd(), 'eslint.config.mjs'), 'utf8')
    const topes = [...config.matchAll(/'max-lines':\s*\['error',\s*\{\s*max:\s*(\d+)/g)]
    expect(topes.length).toBeGreaterThan(0)
    expect(new Set(topes.map((m) => m[1])).size).toBe(1)
  })

  it('se cuenta como cuenta ESLint: fisicas, sin descontar blancos ni comentarios', () => {
    // El propio fichero del dominio sirve de patron: lo que dice `wc -l`.
    const ruta = join(process.cwd(), 'src/domain/shared/limite-de-fichero.ts')
    const texto = readFileSync(ruta, 'utf8')
    expect(cuentaLineas(texto)).toBe(texto.split('\n').length - 1)
  })

  it('el salto final no inventa una linea de mas', () => {
    expect(cuentaLineas('a\nb\n')).toBe(2)
    expect(cuentaLineas('a\nb')).toBe(2)
    expect(cuentaLineas('')).toBe(0)
  })
})
