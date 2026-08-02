import { describe, expect, it } from 'vitest'
import { isPublicSettingKey, SETTINGS_KEYS } from './settings-repository'

describe('isPublicSettingKey', () => {
  it('deja pasar los ajustes normales', () => {
    expect(isPublicSettingKey(SETTINGS_KEYS.operationMode)).toBe(true)
    expect(isPublicSettingKey(SETTINGS_KEYS.budgetPerDay)).toBe(true)
  })

  it('NUNCA deja pasar la API key cifrada', () => {
    // Sin esto, el renderer podia leerla con settings:get y pisarla con
    // settings:set. La key entra por su canal y no vuelve a salir.
    expect(isPublicSettingKey(SETTINGS_KEYS.encryptedApiKey)).toBe(false)
  })

  it('rechaza cualquier clave que no este en la lista', () => {
    expect(isPublicSettingKey('lo_que_sea')).toBe(false)
    expect(isPublicSettingKey('')).toBe(false)
  })
})
