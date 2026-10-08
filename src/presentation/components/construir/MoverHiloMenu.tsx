import { useEffect, useState } from 'react'
import type { Carpeta } from '@domain/chat/carpeta-de-chat'
import type { HiloDeChat } from '@domain/chat/hilo-de-chat'
import { cargarListas } from '../../services/barra-del-chat'
import { moverHilo } from '../../services/gestionar-hilos'

interface MoverHiloMenuProps {
  readonly hilo: HiloDeChat
  readonly onCerrar: () => void
}

const ITEM = 'block w-full rounded px-2 py-1 text-left text-sm text-foreground hover:bg-primary/10'

/** El submenu de Mover: las carpetas (menos la actual) y «Quitar». */
export function MoverHiloMenu({ hilo, onCerrar }: MoverHiloMenuProps): React.JSX.Element {
  const [carpetas, setCarpetas] = useState<readonly Carpeta[]>([])
  useEffect(() => {
    void cargarListas()
      .then((l) => setCarpetas(l.carpetas))
      .catch(console.error)
  }, [])
  const mover = (destino: string | null): void => {
    void moverHilo(hilo.id, destino).catch(console.error).finally(onCerrar)
  }
  const destinos = carpetas.filter((c) => c.id !== hilo.carpetaId)

  return (
    <>
      {destinos.map((c) => (
        <button key={c.id} type="button" onClick={() => mover(c.id)} className={ITEM}>
          {c.nombre}
        </button>
      ))}
      {hilo.carpetaId !== null && (
        <button type="button" onClick={() => mover(null)} className={ITEM}>
          Quitar de la carpeta
        </button>
      )}
      {destinos.length === 0 && hilo.carpetaId === null && (
        <p className="px-2 py-1 text-sm text-muted-foreground">Sin carpetas aun.</p>
      )}
    </>
  )
}
