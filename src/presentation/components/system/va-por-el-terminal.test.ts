import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { VA_POR_EL_TERMINAL } from '@domain/repair/vehiculo-del-motor'

/** Leido del FUENTE: los tests de este repo no pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SYS = 'src/presentation/components/system/'

/**
 * ADR-107 §3.3 — negar sin explicar confunde.
 *
 * La guarda del nacimiento ya impide que el Motor trabaje un proyecto de
 * cliente. Sin el cartel, el operador veria la pagina del Motor con su boton y
 * al pulsarlo no pasaria nada: mandaria a buscar una falla que no existe, que es
 * lo mismo que el drenaje evita distinguiendo «ocupado» de «averia».
 */
describe('a un proyecto de cliente, el Motor le dice cual es su camino', () => {
  it('MotorView corta ANTES del expediente cuando no es el repo propio', () => {
    const vista = fuente(`${SYS}MotorView.tsx`)

    expect(vista).toContain('!project.esRepoPropio')
    expect(vista).toContain('<VaPorElTerminal')
  })

  it('el cartel nombra al Terminal, y el texto sale del DOMINIO', () => {
    const cartel = fuente(`${SYS}VaPorElTerminal.tsx`)

    expect(cartel).toContain('VA_POR_EL_TERMINAL')
    expect(VA_POR_EL_TERMINAL).toContain('Terminal')
    expect(cartel).toContain('Terminal</span>')
  })

  it('el dato viaja del main al renderer: el renderer no puede calcularlo', () => {
    expect(fuente('src/domain/project/proyecto-en-vista.ts')).toContain('esRepoPropio: boolean')
    expect(fuente('src/application/project/proyectos-en-vista.ts')).toContain('esRepoPropio: selfRepo') // prettier-ignore
  })
})
