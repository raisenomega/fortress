import { Icon } from '../common/Icon'
import { convertirAPlan } from '../../services/construir-libre'
import { useConstruirStore } from '../../stores/construir-store'

/** «Convertir a Plan» (PASO 91): cuando la charla libre se vuelve tarea, un
 *  clic la precarga como pedido de plan y cambia el modo — patron del
 *  Transferir. Solo se pinta en libre y con conversacion que convertir. */
export function ConvertirAPlan(): React.JSX.Element | null {
  const mode = useConstruirStore((s) => s.mode)
  const vacia = useConstruirStore((s) => s.messages.length === 0)
  if (mode !== 'libre' || vacia) return null
  return (
    <button
      type="button"
      onClick={convertirAPlan}
      title="Precargar esta conversacion como pedido de Plan"
      className="tap mb-1 inline-flex items-center gap-1 self-start rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20"
    >
      <Icon name="send" size={11} />
      Convertir a Plan
    </button>
  )
}
