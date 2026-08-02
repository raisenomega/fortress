import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl } from './safe-url'

describe('isSafeExternalUrl', () => {
  it('deja pasar enlaces web', () => {
    expect(isSafeExternalUrl('https://docs.anthropic.com')).toBe(true)
    expect(isSafeExternalUrl('http://localhost:5173')).toBe(true)
  })

  it('no abre archivos del disco', () => {
    expect(isSafeExternalUrl('file:///home/jojo/.ssh/id_rsa')).toBe(false)
  })

  it('no ejecuta javascript ni datos incrustados', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('no abre esquemas que el sistema pueda tener asociados a un programa', () => {
    expect(isSafeExternalUrl('smb://servidor/carpeta')).toBe(false)
    expect(isSafeExternalUrl('vscode://file/etc/passwd')).toBe(false)
  })

  it('lo que no es una URL, no se abre', () => {
    expect(isSafeExternalUrl('')).toBe(false)
    expect(isSafeExternalUrl('no soy una url')).toBe(false)
  })
})
