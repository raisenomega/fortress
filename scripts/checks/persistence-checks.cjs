/**
 * Aserciones que se ejecutan DENTRO del renderer, contra el `window.api` real.
 * Se envian como string a executeJavaScript, por eso viven aparte.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  const PATH = '/tmp/fortress-proyecto-de-prueba'
  const base = { name: 'Prueba', path: PATH, stack: 'node', gitRemote: null,
                 gitBranch: 'main', hasClaude: true }

  check('arranca sin proyectos', (await window.api.projects.list()).length === 0)

  const added = await window.api.projects.add(base)
  check('agrega un proyecto', added.ok && added.value.path === PATH,
        JSON.stringify(added))
  const projectId = added.ok ? added.value.id : ''

  const duplicate = await window.api.projects.add(base)
  check('rechaza ruta duplicada', !duplicate.ok, JSON.stringify(duplicate))

  check('persiste el proyecto', (await window.api.projects.list()).length === 1)

  const message = { projectId, role: 'user', content: 'hola',
                    agentId: null, mode: 'supervisado', engine: 'api' }
  const saved = await window.api.chat.append(message)
  check('guarda un mensaje', saved.ok, JSON.stringify(saved))

  const history = await window.api.chat.history(projectId)
  check('recupera el historial', history.length === 1 && history[0].content === 'hola',
        JSON.stringify(history))

  const orphan = await window.api.chat.append({ ...message, projectId: 'no-existe' })
  check('rechaza mensaje huerfano', !orphan.ok, JSON.stringify(orphan))

  const empty = await window.api.chat.append({ ...message, content: '   ' })
  check('rechaza mensaje vacio', !empty.ok, JSON.stringify(empty))

  const other = await window.api.projects.add({ ...base, path: PATH + '-2' })
  const otherId = other.ok ? other.value.id : ''
  await window.api.chat.append({ ...message, projectId: otherId, content: 'otro' })
  const isolated = await window.api.chat.history(projectId)
  check('historiales aislados por proyecto', isolated.length === 1,
        JSON.stringify(isolated))

  // Con una clave real: la lista blanca rechaza las inventadas a proposito.
  // No se usa operation_mode: otra suite comprueba que arranca sin valor.
  await window.api.settings.set('budget_per_run_usd', '2.5')
  check('persiste settings', (await window.api.settings.get('budget_per_run_usd')) === '2.5')

  const fieldOf = async (id, f) => (await window.api.projects.list()).find((p) => p.id === id)?.[f]
  check('el loop nace apagado', (await fieldOf(otherId, 'loopEnabled')) === false)
  await window.api.projects.setLoopEnabled(otherId, true)
  check('enciende el loop', (await fieldOf(otherId, 'loopEnabled')) === true)
  await window.api.projects.setLoopEnabled(otherId, false)
  check('apaga el loop', (await fieldOf(otherId, 'loopEnabled')) === false)
  check('setLoopEnabled rechaza inexistente', !(await window.api.projects.setLoopEnabled('x', true)).ok)
  check('el proyecto nace no confiable', (await fieldOf(otherId, 'trusted')) === false)
  await window.api.projects.setTrusted(otherId, true)
  check('marca de confianza', (await fieldOf(otherId, 'trusted')) === true)
  await window.api.projects.setTrusted(otherId, false)
  check('revoca la confianza', (await fieldOf(otherId, 'trusted')) === false)
  check('setTrusted rechaza inexistente', !(await window.api.projects.setTrusted('x', true)).ok)

  const removed = await window.api.projects.remove(projectId)
  check('borra el proyecto', removed.ok, JSON.stringify(removed))
  check('CASCADE borra su historial',
        (await window.api.chat.history(projectId)).length === 0)
  check('no toca los demas proyectos',
        (await window.api.chat.history(otherId)).length === 1)

  return results
})()`
