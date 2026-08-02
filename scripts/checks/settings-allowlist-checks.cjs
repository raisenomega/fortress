/**
 * Lista blanca de settings. Sale del hallazgo MEDIUM del propio escaneo de
 * FORTRESS: settings:get y settings:set aceptaban cualquier clave, asi que
 * el renderer podia leer la API key cifrada y pisarla.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  // La lista blanca de settings: el hallazgo MEDIUM del propio escaneo.
  const robada = await window.api.settings.get('encrypted_api_key')
  check('settings:get no devuelve la API key cifrada', robada === null, JSON.stringify(robada))

  await window.api.settings.set('encrypted_api_key', 'pisada-desde-el-renderer')
  check('settings:set no puede pisar la API key',
        (await window.api.settings.get('encrypted_api_key')) === null)

  await window.api.settings.set('clave_inventada', 'x')
  check('settings:set ignora claves fuera de la lista',
        (await window.api.settings.get('clave_inventada')) === null)

  await window.api.settings.set('budget_per_day_usd', '7.5')
  check('los topes de gasto si se pueden guardar',
        (await window.api.settings.get('budget_per_day_usd')) === '7.5')

  return results
})()`
