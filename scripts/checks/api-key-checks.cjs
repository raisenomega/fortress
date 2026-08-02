/**
 * Camino sin API key y ciclo de vida de la key cifrada.
 * Se ejecutan DENTRO del renderer, contra el `window.api` real.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  const added = await window.api.projects.add({
    name: 'Chat', path: '/tmp/fortress-chat', stack: 'node',
    gitRemote: null, gitBranch: 'main', hasClaude: false
  })
  const projectId = added.ok ? added.value.id : ''

  check('arranca sin API key', (await window.api.settings.hasApiKey()) === false)

  const noKey = await window.api.chat.send({
    projectId, prompt: 'revisa la seguridad',
    mode: 'supervisado', enabledAgents: ['security-reviewer']
  })
  check('chat.send sin key falla limpio, no crashea',
        !noKey.ok && noKey.error.includes('API key'), JSON.stringify(noKey))
  check('un envio fallido no ensucia el historial',
        (await window.api.chat.history(projectId)).length === 0)

  check('rechaza una API key vacia', !(await window.api.settings.saveApiKey('   ')).ok)

  const saved = await window.api.settings.saveApiKey('sk-ant-de-prueba')
  if (saved.ok) {
    check('guarda la API key cifrada', (await window.api.settings.hasApiKey()) === true)
    await window.api.settings.clearApiKey()
    check('borra la API key guardada', (await window.api.settings.hasApiKey()) === false)
  } else {
    // Sin keyring disponible, lo correcto es negarse: nunca en texto plano.
    check('sin keyring, se niega a guardar en claro',
          saved.error.includes('cifrado'), saved.error)
  }

  const subscription = window.api.chat.onChunk(() => {})
  check('la suscripcion al streaming devuelve un cancelador',
        typeof subscription === 'function')
  subscription()

  return results
})()`
