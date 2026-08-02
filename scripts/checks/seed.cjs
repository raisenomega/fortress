/** Siembra datos de ejemplo via `window.api` para poder ver la UI con contenido. */
module.exports = `(async () => {
  const projects = [
    { name: 'Nucleo', path: '/tmp/nucleo', stack: 'Next.js + Supabase' },
    { name: 'Wudi', path: '/tmp/wudi', stack: 'React + FastAPI' },
    { name: 'Omega', path: '/tmp/omega', stack: 'Next.js + FastAPI' }
  ]

  const created = []
  for (const project of projects) {
    const result = await window.api.projects.add({
      ...project, gitRemote: null, gitBranch: 'main', hasClaude: true
    })
    if (result.ok) created.push(result.value)
  }

  const target = created[0]
  if (target) {
    await window.api.chat.append({
      projectId: target.id, role: 'user', agentId: null, mode: 'supervisado',
      content: 'revisa la seguridad de este proyecto'
    })
    await window.api.chat.append({
      projectId: target.id, role: 'assistant', agentId: 'security-reviewer',
      mode: 'supervisado',
      content: 'Encontre 2 CRITICAL:\\n1. SQL injection en api/routes.py:42\\n' +
               '2. Secret hardcodeado en config.py:18'
    })
  }

  return created.length
})()`
