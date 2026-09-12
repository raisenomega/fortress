import { Component, type ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  readonly children: ReactNode
}

interface State {
  readonly roto: boolean
}

/**
 * Lo que se ve cuando una vista revienta, en vez de la pantalla en blanco.
 *
 * Es la MITAD VISIBLE del embudo 3 (ADR-086). La otra —observar el fallo— vive
 * en `onUncaughtError` de la raiz, que ve el arbol entero sin que nadie envuelva
 * nada; este solo existe para que el operador vea algo y pueda seguir. Son dos
 * cosas distintas a proposito: un boundary que ademas observara obligaria a
 * poner uno por seccion para no perderse nada, que es el problema de los 110
 * handlers otra vez.
 *
 * No dice QUE se rompio. El mensaje de un error de render nace de los datos que
 * el componente pintaba —y esos son del cliente—, asi que la pantalla dice lo
 * unico que le sirve a quien esta delante: que pasó y que puede hacer.
 */
export class ErrorBoundary extends Component<Props, State> {
  public override state: State = { roto: false }

  /** Sin `componentDidCatch`, y no por olvido: React trata la clase como
   *  boundary con solo esto, y su `logCaughtError` —que es quien dispara el
   *  `onCaughtError` de la raiz— ya cuelga de esta rama. Leido en la fuente de
   *  react-dom, no supuesto. Un metodo vacio al lado solo seria ruido. */
  public static getDerivedStateFromError(): State {
    return { roto: true }
  }

  public override render(): ReactNode {
    if (!this.state.roto) return this.props.children

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <Icon name="alert-triangle" size={28} className="text-critical" />
        <h1 className="font-display text-lg text-foreground">Algo se rompio en esta vista</h1>
        <p className="max-w-sm text-xs text-muted-foreground">
          FORTRESS sigue viva y tu trabajo esta guardado. Recarga para volver a la ultima pantalla.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="tap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
        >
          Recargar
        </button>
      </div>
    )
  }
}
