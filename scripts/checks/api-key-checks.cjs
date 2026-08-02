/**
 * Camino sin API key y ciclo de vida de la key cifrada.
 * Se ejecutan DENTRO del renderer, contra el `window.api` real.
 *
 * Guardar valida la key contra la API real, asi que el resultado depende de si
 * la maquina tiene red. Se comprueba el invariante en ambos casos, no un
 * resultado concreto.
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

  const saved = await window.api.settings.saveApiKey('sk-ant-clave-falsa-de-prueba')
  if (saved.ok) {
    // Sin red no se puede afirmar que sea mala: se guarda avisando.
    check('sin verificar, avisa en el veredicto',
          saved.value.status === 'sin-verificar', JSON.stringify(saved.value))
    check('la key queda guardada', (await window.api.settings.hasApiKey()) === true)
    await window.api.settings.clearApiKey()
    check('borra la API key guardada', (await window.api.settings.hasApiKey()) === false)
  } else {
    // Con red la API la rechaza; sin keyring tampoco se guarda en claro.
    check('una key no aceptada nunca se guarda',
          (await window.api.settings.hasApiKey()) === false, saved.error)
  }

  const stored = await window.api.settings.checkApiKey()
  check('revalidar sin key configurada informa que falta',
        stored.status === 'invalida', JSON.stringify(stored))

  const subscription = window.api.chat.onChunk(() => {})
  check('la suscripcion al streaming devuelve un cancelador',
        typeof subscription === 'function')
  subscription()

  return results
})()`
