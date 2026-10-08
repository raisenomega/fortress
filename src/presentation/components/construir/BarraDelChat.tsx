import { useEffect, useState } from 'react'
import { cargarListas, elegirHilo, type ListasDeLaBarra } from '../../services/barra-del-chat'
import { useBarraStore } from '../../stores/barra-store'

const VACIAS: ListasDeLaBarra = { carpetas: [], sueltos: [] }

/** La barra organizadora del Chat (PASO 116): SOLO el plano de libre —
 *  carpetas (crear llega en Fase 3) y los hilos sueltos. El clic MANDA:
 *  fija la seleccion viva y ese hilo gana a la rehidratacion-por-par. */
export function BarraDelChat(): React.JSX.Element {
  const seleccion = useBarraStore((s) => s.seleccion)
  const [listas, setListas] = useState(VACIAS)
  useEffect(() => {
    void cargarListas().then(setListas).catch(console.error)
  }, [seleccion])

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">CARPETAS</p>
      {listas.carpetas.map((c) => (
        <p key={c.id} className="truncate px-2 py-1 text-sm text-foreground">
          {c.nombre}
        </p>
      ))}
      <p className="pt-3 text-[11px] font-semibold tracking-wide text-muted-foreground">
        SIN CARPETA
      </p>
      {listas.sueltos.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => void elegirHilo(h)}
          className={`truncate rounded px-2 py-1 text-left text-sm hover:bg-primary/10 ${
            h.id === seleccion ? 'text-primary' : 'text-foreground'
          }`}
        >
          {h.titulo}
        </button>
      ))}
    </aside>
  )
}
