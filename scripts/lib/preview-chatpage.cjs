/** Pagina "Chat" (planificacion): su input con adjuntar, selector de modo y enviar. */
const { clickByText, clickSelector } = require('../checks/ui-scripts.cjs')

async function walkChatPage(helpers) {
  const { run, pause, shoot, expect } = helpers

  // Exige proyecto de confianza: primero se marca desde la cabecera del Terminal.
  await run(clickByText('No confiable'))
  await pause(400)
  await run(clickSelector('[data-nav="Chat"]'))
  await pause(500)
  await shoot('-chat-page')
  await expect('pagina chat', 'Chat de', 'Describe lo que quieres')
}

module.exports = { walkChatPage }
