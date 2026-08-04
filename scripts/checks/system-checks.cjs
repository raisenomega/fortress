/**
 * Auto-mejora de FORTRESS, contra el `window.api` real: prueba que la cadena
 * completa (IPC -> handler -> describeCapabilities -> repos SQLite + ledger de
 * agent_runs -> base real) responde sin lanzar. Sin auto-creacion todavia, las
 * listas nacen vacias; lo que se verifica aqui es el cableado, no el volumen.
 */
module.exports = `(async () => {
  const results = []
  const check = (name, condition, detail) =>
    results.push({ name, pass: Boolean(condition), detail: detail ?? '' })

  const obs = await window.api.system.observations()
  check('backlog de auto-mejora vivo, arranca vacio',
        Array.isArray(obs) && obs.length === 0, JSON.stringify(obs))

  const caps = await window.api.system.capabilities()
  check('capacidades derivadas del historial, arrancan vacias',
        Array.isArray(caps) && caps.length === 0, JSON.stringify(caps))

  const promoted = await window.api.system.promoteCapability('no-existe', true)
  check('promover una capacidad inexistente falla limpio',
        promoted && promoted.ok === false, JSON.stringify(promoted))

  return results
})()`
