import '@presentation/styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@presentation/App'
import { ErrorBoundary } from '@presentation/components/common/ErrorBoundary'
import { manejarFalloDeRender } from '@presentation/services/fallo-de-render'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontro el nodo #root en index.html')

/**
 * El embudo 3 (ADR-086), en sus dos mitades. `onUncaughtError` ve TODO el arbol
 * sin que nadie envuelva nada —es la forma (b) que el embudo de IPC tuvo que
 * construirse a mano, y que React 19 regala—, y `onCaughtError` recoge ademas
 * lo que el boundary ya atrapo, que si no se perderia. El `ErrorBoundary` es la
 * otra mitad: no observa, pinta, para que un fallo no deje la pantalla en blanco.
 *
 * DESCONECTADO A PROPOSITO. `manejarFalloDeRender` construye la observacion y no
 * la asienta: llevarla al backlog pide un metodo en `preload/index.ts`, que es
 * INNEGOCIABLE. Los cuatro pasos que lo activan estan en esa funcion, y hasta
 * entonces `fallo-de-render` no entra en el vocabulario: area y emisor nacen
 * juntos o el vocabulario se llena de nombres sin nadie detras (ADR-081).
 */
createRoot(container, {
  onUncaughtError: (error, info) => void manejarFalloDeRender(error, info),
  onCaughtError: (error, info) => void manejarFalloDeRender(error, info)
}).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
