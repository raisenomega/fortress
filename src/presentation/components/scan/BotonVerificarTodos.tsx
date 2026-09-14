import { useConfirmarVerificacion } from '../../hooks/useConfirmarVerificacion'
import { useVerificacionMasivaStore } from '../../stores/verificacion-masiva-store'
import { ConfirmVerificarTodos } from './ConfirmVerificarTodos'
import { Icon } from '../common/Icon'

interface BotonVerificarTodosProps {
  readonly projectId: string
  readonly mitigados: number
  readonly disabled: boolean
}

const BOTON =
  'tap border-border text-foreground hover:border-primary/50 flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs disabled:opacity-50'

/**
 * Arranca el barrido de mitigados, o lo para si ya corre (ADR-087, Fase 3). La
 * confirmacion cuelga de AQUI y no de la cabecera porque es de este boton: quien
 * pregunta es quien va a gastar.
 *
 * Vive en el tablero de ESCANEO y no en el del motor porque el mitigado es del
 * hallazgo: aqui es donde el operador puso la marca, y aqui es donde tiene que
 * poder pedir que se compruebe.
 */
export function BotonVerificarTodos({
  projectId,
  mitigados,
  disabled
}: BotonVerificarTodosProps): React.JSX.Element {
  const corriendo = useVerificacionMasivaStore((state) => state.projectId)
  const hechos = useVerificacionMasivaStore((state) => state.hechos)
  const total = useVerificacionMasivaStore((state) => state.total)
  const verificando = corriendo === projectId
  // Sin mitigados no hay nada que verificar. Se apaga en vez de ofrecer un clic
  // que solo sirve para contestar que no hay nada: el (0) ya lo dijo.
  const sinNada = mitigados === 0 && !verificando
  const confirmar = useConfirmarVerificacion(projectId, verificando, mitigados)

  return (
    <>
      <button
        type="button"
        disabled={disabled || sinNada || (corriendo !== null && !verificando)}
        onClick={confirmar.alPulsar}
        title={
          sinNada
            ? 'No hay mitigados que verificar'
            : 'Un analista comprueba, uno a uno, si el problema sigue en el codigo'
        }
        className={BOTON}
      >
        <span className={verificando ? 'animate-spin' : ''}>
          <Icon name={verificando ? 'refresh-cw' : 'check-check'} size={12} />
        </span>
        {verificando
          ? `Verificando ${hechos} de ${total}... (parar)`
          : `Verificar todos los mitigados (${mitigados})`}
      </button>

      {confirmar.preguntando ? (
        <ConfirmVerificarTodos
          mitigados={mitigados}
          alcance="todos"
          onCancel={confirmar.cerrar}
          onConfirm={confirmar.arrancar}
        />
      ) : null}
    </>
  )
}
