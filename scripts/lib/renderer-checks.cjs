/** Utilidades para suites que mezclan asercion en el renderer y estado en node. */
function createRecorder(window) {
  const results = []

  return {
    results,
    check: (name, pass, detail) =>
      results.push({ name, pass: Boolean(pass), detail: detail ?? '' }),
    /** Evalua la expresion dentro del renderer, contra el `window.api` real. */
    run: (code) => window.webContents.executeJavaScript(code)
  }
}

/** Alta de proyecto como la haria la UI, para no repetir el objeto entero. */
function addProject(name, path, gitRemote) {
  const remote = gitRemote ? `'${gitRemote}'` : 'null'
  return `window.api.projects.add({ name: '${name}', path: '${path}', stack: 'node',
    gitRemote: ${remote}, gitBranch: 'main', hasClaude: true })`
}

module.exports = { createRecorder, addProject }
