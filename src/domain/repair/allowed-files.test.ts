import { describe, expect, it } from 'vitest'
import { computeAllowedFiles } from './allowed-files'

const PRIMARY = 'src/domain/newproject/target-path.ts'
const HERMANOS = [PRIMARY, 'src/domain/newproject/target-path.test.ts', 'src/domain/newproject/target-path.spec.ts'] // prettier-ignore

/** El `where` REAL de la corrida 77e377fd (seq 5 del libro), textual. */
const WHERE_REAL =
  'El punto natural es resolveTarget en src/domain/newproject/target-path.ts (linea 15, ' +
  'justo donde hoy solo se comprueba el vacio), porque es el cuello de botella por el que ' +
  'pasan los dos caminos: planFolder (preview) y createFolder (creacion real), ambos ' +
  'expuestos por IPC en src/infrastructure/ipc/newproject-handlers.ts. Validar ahi cubre ' +
  'tambien la fuga de listado, porque describeExisting solo se alcanza con un target que ' +
  'resolveTarget haya aceptado.'

describe('computeAllowedFiles (I2.1: anclada al file estructurado)', () => {
  it('a) solo el ancla: archivo + tests hermanos', () => {
    expect(computeAllowedFiles({ primaryFile: PRIMARY })).toEqual(HERMANOS)
  })

  it('b) hint con path del MISMO dir: entra como extra', () => {
    const files = computeAllowedFiles({
      primaryFile: PRIMARY,
      hint: 'tocar tambien src/domain/newproject/parent-dir.ts por el listado'
    })
    expect(files).toEqual([...HERMANOS, 'src/domain/newproject/parent-dir.ts'])
  })

  it('c) hint con path de OTRO dir: NO entra (la prosa no arrastra el repo)', () => {
    const files = computeAllowedFiles({
      primaryFile: PRIMARY,
      hint: 'y el handler src/infrastructure/ipc/newproject-handlers.ts'
    })
    expect(files).toEqual(HERMANOS)
  })

  it('d) hint prosa sin paths: solo ancla + hermanos', () => {
    expect(computeAllowedFiles({ primaryFile: PRIMARY, hint: 'validar antes de crear' })).toEqual(HERMANOS) // prettier-ignore
  })

  it('e) FIXTURE REAL de 77e377fd: la correa que la primera corrida merecia', () => {
    expect(computeAllowedFiles({ primaryFile: PRIMARY, hint: WHERE_REAL })).toEqual(HERMANOS)
  })

  it('f) ancla .tsx: hermanos .test.tsx y .spec.tsx', () => {
    expect(computeAllowedFiles({ primaryFile: 'src/ui/Chip.tsx' })).toEqual([
      'src/ui/Chip.tsx',
      'src/ui/Chip.test.tsx',
      'src/ui/Chip.spec.tsx'
    ])
  })

  it('g) ancla no-codigo (.html): solo ella; ancla invalida: correa vacia', () => {
    expect(computeAllowedFiles({ primaryFile: 'src/renderer/index.html' })).toEqual(['src/renderer/index.html']) // prettier-ignore
    expect(computeAllowedFiles({ primaryFile: 'una frase sin path' })).toEqual([])
    expect(computeAllowedFiles({ primaryFile: '' })).toEqual([])
  })
})
