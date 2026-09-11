import { describe, expect, it } from 'vitest'
import { redactarObservacion, RUTA_REDACTADA } from './cerco-de-observacion'

describe('el cerco redacta la CITA y conserva la NOTA', () => {
  it('la ruta se va, el aprendizaje se queda', () => {
    const nota = 'el grafo no modela politicas RLS en supabase/functions/x.ts:40'

    const limpia = redactarObservacion(nota)

    expect(limpia).toContain(RUTA_REDACTADA)
    expect(limpia).not.toContain('supabase/functions/x.ts:40')
    expect(limpia).toContain('el grafo no modela politicas RLS')
  })

  it('una nota que es TODA cita no se descarta: se redacta a lo que quede', () => {
    // ADR-065: ante la duda se conserva. Devolver cadena vacia seria rechazar
    // por la puerta de atras, y rechazar es justo lo que este cerco NO hace.
    expect(redactarObservacion('src/a.ts:1')).toBe(RUTA_REDACTADA)
  })

  it('un secreto pegado a la cita tambien cae: el cerco LLAMA a redactSecrets', () => {
    const limpia = redactarObservacion('fallo con token=sk-ant-abc123def en apps/api/x.ts')

    expect(limpia).not.toContain('sk-ant-abc123def')
    expect(limpia).not.toContain('apps/api/x.ts')
  })

  it('la raiz absoluta del proyecto se oculta si se sabe cual es', () => {
    const nota = 'no pudo leer /media/jojo/Disco/Cliente ACME entero'

    expect(redactarObservacion(nota, '/media/jojo/Disco/Cliente ACME')).toBe(
      `no pudo leer ${RUTA_REDACTADA} entero`
    )
  })
})

describe('lo que el cerco NO destroza', () => {
  it('un fichero generico sin carpeta sobrevive: no identifica a nadie', () => {
    const nota = 'el brief manda leer README.md y ahi esta la plantilla de Lovable'

    expect(redactarObservacion(nota)).toBe(nota)
  })

  it('los simbolos y las APIs sobreviven: son lo que hace util la nota', () => {
    const nota = 'trace_path devolvio ambiguous, y supabase.storage.from no tiene nodo'

    expect(redactarObservacion(nota)).toBe(nota)
  })

  it('una nota sin ninguna cita pasa entera', () => {
    const nota = 'plan-mode impidio escribir el fichero de plan y no hubo forma de seguir'

    expect(redactarObservacion(nota)).toBe(nota)
  })
})
