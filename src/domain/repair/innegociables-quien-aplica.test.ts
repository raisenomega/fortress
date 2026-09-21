import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AUTONOMY_RULES_FILES } from './auto-merge-blacklist'
import { defensasQueToca } from './firma-limite'

/**
 * Quien APLICA la lista innegociable tiene que estar EN la lista.
 *
 * Es la clase que `innegociables-derivados` no barria, y el hueco de siempre
 * visto desde el otro lado: alli se protege a quien implementa una defensa; aqui
 * a quien decide que esa proteccion se cumpla. `defensasQueToca` es una funcion
 * de una linea, y una propuesta que la dejara en `return []` apagaba el limite
 * de la firma entero sin tocar un solo fichero protegido — medido el 2026-09-20:
 * `defensasQueToca(['src/domain/repair/firma-limite.ts'])` devolvia `[]`.
 *
 * Se deriva por quien la NOMBRA en codigo, no en prosa. Queda fuera a proposito
 * `resumen-cerco`, que solo CUENTA trabajables para el panel: el criterio es
 * «si cambiarlo debilita una defensa», y contar mal no la debilita.
 */
const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

const codigo = (f: string): string =>
  readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const cubierto = (f: string): boolean =>
  AUTONOMY_RULES_FILES.some((p) => p === f || (p.endsWith('/**') && f.startsWith(p.slice(0, -2))))

const aplican = ficheros('src').filter((f) => /\bdefensasQueToca\b/.test(codigo(f)))

describe('quien aplica la lista innegociable esta en la lista', () => {
  it('el barrido encuentra a quien la define y a quien la invoca', () => {
    expect(aplican).toContain('src/domain/repair/firma-limite.ts')
    expect(aplican.length).toBeGreaterThan(2)
  })

  it.each(aplican)('%s es innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('el limite de la firma se protege a si mismo', () => {
    const limite = 'src/domain/repair/firma-limite.ts'
    expect(defensasQueToca([limite])).toEqual([limite])
  })
})
