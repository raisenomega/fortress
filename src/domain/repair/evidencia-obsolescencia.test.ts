import { describe, expect, it } from 'vitest'
import { estaProbado, type Evidencia } from './evidencia-obsolescencia'

const ausente = (marcador: string): Evidencia => ({ marcador, forma: 'ausente' })
const presente = (marcador: string): Evidencia => ({ marcador, forma: 'presente' })

/** El fichero real que hundio a los dos casos dudosos del 23-ago. */
const CSP = `<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; style-src 'self' 'unsafe-inline'" />`

describe('la prueba de un OBSOLETO se comprueba, no se cree', () => {
  it('ausente: el marcador ya no esta, el defecto se fue', () => {
    // loop-verify.ts: el execFile crudo se sustituyo por runCommand (d9af784).
    expect(estaProbado(ausente('execFile('), 'const salida = await runCommand(...)').probado).toBe(true) // prettier-ignore
  })

  it('presente: el control que lo tapa existe ahora', () => {
    // run-accumulator.ts (dd85d9f) y SECURITY-MODEL.md (e19563b): los dos cierran
    // por lo que el fichero GANO, no por lo que perdio.
    expect(estaProbado(presente('redactSecrets(stderr)'), 'return redactSecrets(stderr).trim()').probado).toBe(true) // prettier-ignore
    expect(estaProbado(presente('salvo'), 'Firma humana antes del merge, salvo el cerco').probado).toBe(true) // prettier-ignore
  })

  it('LOS DOS CSP: el marcador sigue en el fichero, asi que no prueba nada', () => {
    // Citaban un commit real y exacto que solo habia anadido un comentario. La
    // relajacion seguia —y sigue— en la linea de la meta.
    const prueba = estaProbado(ausente("'unsafe-inline'"), CSP)
    expect(prueba.probado).toBe(false)
    expect(prueba.motivo).toContain('deberia estar ausente')
  })

  it('sin evidencia no hay prueba: es el caso del analisis que no se dejo leer', () => {
    expect(estaProbado(undefined, 'lo que sea').probado).toBe(false)
    expect(estaProbado(undefined, 'lo que sea').motivo).toContain('no trajo evidencia')
  })

  it('un marcador vacio no cuenta como ausencia trivial', () => {
    expect(estaProbado(ausente('   '), 'cualquier cosa').probado).toBe(false)
  })

  it('fichero ilegible: NO es prueba de que el defecto se fuera', () => {
    // `null` tambien lo devuelve una ruta que se sale del proyecto, y la ruta la
    // escribe un agente. Tratarlo como ausencia seria permiso para borrar.
    const prueba = estaProbado(ausente('execFile('), null)
    expect(prueba.probado).toBe(false)
    expect(prueba.motivo).toContain('no se pudo leer')
  })

  it('INC-2: estaProbado IGNORA `file` — el contenido ya viene elegido (lo hace extinguirSiObsoleto)', () => {
    // El campo `file` del contrato dice de que fichero sale el contenido, pero
    // quien lo lee es extinguirSiObsoleto; aqui el resultado depende SOLO del
    // marcador contra el contenido dado. Mutar estaProbado para que mire `file`
    // rompe esta igualdad.
    const conFile: Evidencia = { marcador: 'execFile(', forma: 'ausente', file: 'otra/cosa.ts' }
    const sinFile: Evidencia = { marcador: 'execFile(', forma: 'ausente' }
    const texto = 'const salida = await runCommand(...)'
    expect(estaProbado(conFile, texto)).toEqual(estaProbado(sinFile, texto))
    expect(estaProbado(conFile, 'sigue execFile( aqui')).toEqual(estaProbado(sinFile, 'sigue execFile( aqui')) // prettier-ignore
  })
})
