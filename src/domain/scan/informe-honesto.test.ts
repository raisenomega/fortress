import { describe, expect, it } from 'vitest'
import { COMPLETO } from './informe-fixture'
import { componerInforme } from './informe-de-auditoria'
import { SIN_CAMPANA } from './modulos-del-cierre'

const ABORTADO = componerInforme({
  ...COMPLETO,
  estado: 'ABORTADO',
  motivo: 'abortado',
  paradasHechas: 3,
  ficherosCubiertos: 120
})

describe('la cobertura de un cortado jamas dice 100 %', () => {
  it('transcribe lo que alcanzo, y por que se corto', () => {
    expect(ABORTADO).toContain('Audito **120 de 1730** ficheros, en **3 de 10** paradas.')
    expect(ABORTADO).toContain('**Cierre:** ABORTADO — lo detuvo el operador.')
  })

  it('sin manifiesto no inventa un total: lo dice', () => {
    const sinMedir = componerInforme({ ...COMPLETO, ficherosCubiertos: null, ficherosTotal: null })

    expect(sinMedir).toContain('Sin manifiesto: no consta cuantos ficheros se miraron')
  })

  it('sin temas corridos tampoco los finge', () => {
    const sinTemas = componerInforme({
      ...COMPLETO,
      modulos: { ...COMPLETO.modulos, temasCorridos: [] }
    })

    expect(sinTemas).toContain('Ningun modulo tematico corrio.')
  })
})

describe('la cadena de custodia no inventa un ancla', () => {
  it('con git, cita el HEAD real', () => {
    expect(componerInforme(COMPLETO)).toContain(`\`${'a'.repeat(40)}\``)
  })

  it('SIN git lo confiesa, y cita huellas de fichero en su lugar', () => {
    const sinGit = componerInforme({
      ...COMPLETO,
      headSha: null,
      huellas: [{ fichero: 'src/a.ts', sha256: 'b'.repeat(64) }]
    })

    expect(sinGit).toContain('**HEAD del proyecto:** sin git — no consta')
    expect(sinGit).toContain('| `src/a.ts` | `bbbb')
  })

  it('sin git y sin huellas, calla las huellas pero sigue confesando', () => {
    const pelado = componerInforme({ ...COMPLETO, headSha: null })

    expect(pelado).toContain('sin git — no consta')
    expect(pelado).not.toContain('SHA-256')
  })

  it('siempre firma con la version y el escaneo', () => {
    expect(componerInforme(COMPLETO)).toContain('**FORTRESS:** v1.0.0')
    expect(componerInforme(COMPLETO)).toContain('`scan-1`')
  })
})

describe('un escaneo anterior a la campaña lo dice', () => {
  it('no finge que no aplicaba ninguno', () => {
    const viejo = componerInforme({ ...COMPLETO, modulos: SIN_CAMPANA })

    expect(viejo).toContain('no consta qué módulos le aplicaban')
    expect(viejo).toContain('No es que no aplicara ninguno')
  })
})
