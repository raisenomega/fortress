import { describe, expect, it } from 'vitest'
import { computeAllowedFiles } from './allowed-files'

describe('computeAllowedFiles (la correa de D10)', () => {
  it('un .ts permite el archivo y sus tests hermanos', () => {
    expect(computeAllowedFiles('src/domain/newproject/target-path.ts')).toEqual([
      'src/domain/newproject/target-path.ts',
      'src/domain/newproject/target-path.test.ts',
      'src/domain/newproject/target-path.spec.ts'
    ])
  })

  it('un .tsx permite hermanos .test.tsx y .spec.tsx', () => {
    expect(computeAllowedFiles('src/ui/Chip.tsx')).toEqual([
      'src/ui/Chip.tsx',
      'src/ui/Chip.test.tsx',
      'src/ui/Chip.spec.tsx'
    ])
  })

  it('un archivo que no es codigo ts/tsx se permite SOLO a si mismo', () => {
    expect(computeAllowedFiles('src/renderer/index.html')).toEqual(['src/renderer/index.html'])
  })

  it('un where que no parece archivo devuelve vacio: sin correa no se genera', () => {
    expect(computeAllowedFiles('la funcion resolveTarget del build')).toEqual([])
    expect(computeAllowedFiles('')).toEqual([])
    expect(computeAllowedFiles('src/carpeta/sin-extension')).toEqual([])
  })
})
