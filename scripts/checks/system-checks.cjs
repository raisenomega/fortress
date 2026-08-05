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

  const proposed = await window.api.system.proposeCapability(
    { kind: 'agente', name: 'Redactor de pruebas', originObservation: 'manual' })
  check('proponer una capacidad la crea en propuesta',
        proposed && proposed.ok && proposed.value.phase === 'propuesta', JSON.stringify(proposed))

  const live = await window.api.system.capabilities()
  check('la capacidad propuesta aparece viva en propuesta',
        live.length === 1 && live[0].phase === 'propuesta', JSON.stringify(live))

  const early = await window.api.system.promoteCapability(proposed.value.id, true)
  check('sin episodios no se puede promover (el freno del ciclo)',
        early && early.ok === false, JSON.stringify(early))

  const noted = await window.api.system.addCapabilityNote(
    { capabilityId: proposed.value.id, author: 'operador', note: 'refuerza el enfoque X' })
  check('dejar una nota de refuerzo funciona', noted && noted.ok, JSON.stringify(noted))
  const notes = await window.api.system.capabilityNotes(proposed.value.id)
  check('la nota de refuerzo aparece en la capacidad',
        notes.length === 1 && notes[0].note.length > 0, JSON.stringify(notes))

  return results
})()`
