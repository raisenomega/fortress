import type { EstadoDelTablero } from '@domain/project/estado-del-tablero'

/**
 * Como se llama cada casilla en pantalla. Vive aparte del componente por lo
 * mismo que `CLASE_EN_PANTALLA` en la historia: el vocabulario del dominio es
 * `por-reparar`, y lo que el operador lee es «Por reparar». Traducir en el JSX
 * repartiria el idioma por los componentes.
 */
export const NOMBRE_DEL_ESTADO: Record<EstadoDelTablero, { texto: string; ayuda: string }> = {
  'por-reparar': {
    texto: 'Por reparar',
    ayuda: 'Piden trabajo: el problema sigue ahi y nadie lo ha dado por arreglado'
  },
  mitigados: {
    texto: 'Mitigados',
    ayuda: 'El limbo: los diste por arreglados y nadie lo ha comprobado. Son los verificables'
  },
  descartados: {
    texto: 'Descartados',
    ayuda: 'Decidiste que no contaban. No bloquean el push'
  }
}
