import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RenombrarInput } from './RenombrarInput'

/** Hallazgo f7d5a6c4 (accesibilidad): el campo de renombrar no tenia nombre
 *  accesible; un lector lo anunciaba como «editar texto» sin mas. */
const pintar = (etiqueta?: string): string =>
  renderToStaticMarkup(
    createElement(RenombrarInput, { inicial: 'x', onAceptar: () => {}, onCancelar: () => {}, etiqueta }),
  )

describe('el campo de renombrar tiene nombre accesible', () => {
  it('por defecto lleva aria-label «Nuevo nombre»', () => {
    expect(pintar()).toContain('aria-label="Nuevo nombre"')
  })

  it('el llamante puede precisar la etiqueta', () => {
    expect(pintar('Renombrar carpeta')).toContain('aria-label="Renombrar carpeta"')
  })
})
