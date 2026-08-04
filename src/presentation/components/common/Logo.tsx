import wordmark from '../../assets/fortress-wordmark.png'
import mark from '../../assets/fortress-logo.png'

export const APP_NAME = 'FORTRESS. by Raisen'
/** Version real del binario (package.json). No se maquilla. */
export const APP_VERSION = '1.0.0'

interface LogoProps {
  /** `wordmark` es el logotipo horizontal; `mark` el cuadrado. */
  readonly variant?: 'wordmark' | 'mark'
  readonly className?: string
}

/** Unica imagen oficial de la app. No se sustituye por texto ni por iconos. */
export function Logo({ variant = 'wordmark', className }: LogoProps): React.JSX.Element {
  return (
    <img
      src={variant === 'wordmark' ? wordmark : mark}
      alt={APP_NAME}
      draggable={false}
      className={`select-none object-contain ${className ?? ''}`}
    />
  )
}
