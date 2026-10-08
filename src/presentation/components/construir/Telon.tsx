interface TelonProps {
  readonly onCerrar: () => void
}

/** El telon invisible de un menu flotante: clic fuera = cerrar. Vive bajo
 *  el menu (z-10 contra z-20) y cubre toda la ventana. */
export function Telon({ onCerrar }: TelonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label="Cerrar menu"
      onClick={onCerrar}
      className="fixed inset-0 z-10 cursor-default"
    />
  )
}
