import { CheckCheck, RotateCcw } from 'lucide-react'

interface AccionesDelMitigadoProps {
  readonly onVerificar: () => void
  readonly onUnmitigate: () => void
  readonly ocupado: boolean
}

const BOTON = 'tap mr-2 text-muted-foreground hover:text-foreground'

/**
 * El par del limbo: deshacer la marca, o pedir que se compruebe (ADR-087).
 *
 * Confirmar NO cierra nada por si mismo. Lanza al analista, que lee el fichero;
 * si prueba la ausencia el hallazgo muere con juicio, y si no la prueba se queda
 * mitigado con la razon escrita. Esa segunda mitad es el punto: un arreglo que
 * no cerro el problema no lo cierra en el tablero.
 *
 * `ocupado` apaga el boton porque detras hay UN carril —`guardRun` rechaza la
 * segunda corrida sobre el mismo proyecto— y ofrecer un clic que el proceso
 * principal va a rechazar es peor que no ofrecerlo.
 */
export function AccionesDelMitigado({
  onVerificar,
  onUnmitigate,
  ocupado
}: AccionesDelMitigadoProps): React.JSX.Element {
  return (
    <>
      <button
        type="button"
        onClick={onVerificar}
        disabled={ocupado}
        title="Confirmar: un agente lee el fichero y comprueba que el problema ya no esta"
        className={`${BOTON} disabled:opacity-40`}
      >
        <CheckCheck size={13} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onUnmitigate}
        title="Deshacer: vuelve a la cola del motor"
        className={BOTON}
      >
        <RotateCcw size={13} aria-hidden />
      </button>
    </>
  )
}
