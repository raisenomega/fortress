import { useEffect, useState } from 'react'
import { cargarListas, type ListasDeLaBarra } from '../../services/barra-del-chat'
import { useBarraStore } from '../../stores/barra-store'
import { useConstruirStore } from '../../stores/construir-store'
import { CabeceraDeLaBarra } from './CabeceraDeLaBarra'
import { FilaDeCarpeta } from './FilaDeCarpeta'
import { FilaDeHilo } from './FilaDeHilo'

const VACIAS: ListasDeLaBarra = { carpetas: [], sueltos: [] }
const SECCION = 'text-[11px] font-semibold tracking-wide text-muted-foreground'

/** La barra del Chat, ARBOL puro (Revision A): carpetas-acordeon arriba y
 *  sueltos abajo — SOLO el plano de libre. El clic en un hilo MANDA. */
export function BarraDelChat(): React.JSX.Element {
  const seleccion = useBarraStore((s) => s.seleccion)
  const busy = useConstruirStore((s) => s.busy)
  const [listas, setListas] = useState(VACIAS)
  useEffect(() => {
    void cargarListas().then(setListas).catch(console.error)
  }, [seleccion, busy])

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
      <CabeceraDeLaBarra />
      <p className={SECCION}>CARPETAS</p>
      {listas.carpetas.map((c) => (
        <FilaDeCarpeta key={c.id} carpeta={c} seleccion={seleccion} />
      ))}
      <p className={`pt-3 ${SECCION}`}>SIN CARPETA</p>
      {listas.sueltos.map((h) => (
        <FilaDeHilo key={h.id} hilo={h} elegido={h.id === seleccion} />
      ))}
    </aside>
  )
}
