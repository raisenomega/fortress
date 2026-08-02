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
                    agentId: null, mode: 'supervisado' }
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

  await window.api.settings.set('clave', 'valor')
  check('persiste settings', (await window.api.settings.get('clave')) === 'valor')

  const removed = await window.api.projects.remove(projectId)
  check('borra el proyecto', removed.ok, JSON.stringify(removed))
  check('CASCADE borra su historial',
        (await window.api.chat.history(projectId)).length === 0)
  check('no toca los demas proyectos',
        (await window.api.chat.history(otherId)).length === 1)

  return results
})()`
