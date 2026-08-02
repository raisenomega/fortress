/** Persistencia del modo de operacion, contra el `window.api` real. */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  const KEY = 'operation_mode'

  check('sin elegir modo no hay valor guardado',
        (await window.api.settings.get(KEY)) === null)

  await window.api.settings.set(KEY, 'autonomo')
  check('el modo elegido se persiste',
        (await window.api.settings.get(KEY)) === 'autonomo')

  await window.api.settings.set(KEY, 'supervisado')
  check('el modo se puede revertir',
        (await window.api.settings.get(KEY)) === 'supervisado')

  return results
})()`
