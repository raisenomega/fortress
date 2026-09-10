import { describe, expect, it } from 'vitest'
import { botonDeEscaneo } from './boton-de-escaneo'

describe('que boton toca durante un recorrido', () => {
  it('sobre el proyecto que escanea: Detener', () => {
    expect(botonDeEscaneo('p1', 'p1')).toBe('detener')
  })

  it('en reposo: Escanear seguridad', () => {
    expect(botonDeEscaneo(null, 'p1')).toBe('escanear')
  })

  it('con OTRO proyecto escaneando: ocupado, ni escanear ni detener', () => {
    // Detener el de al lado seria parar un trabajo que no se esta mirando.
    expect(botonDeEscaneo('p2', 'p1')).toBe('ocupado')
  })
})
