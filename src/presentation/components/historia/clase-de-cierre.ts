import type { ClaseDeExtincion } from '@domain/project/clase-de-extincion'

/**
 * Como se dice cada clase en pantalla, y con que tono.
 *
 * Ninguna de las tres dice «resuelto» salvo la primera, y esa lo dice entero:
 * «un agente lo comprobo». Las otras dos explican QUE fueron, porque un chip que
 * dijera solo «cerrado» las dejaria pareciendo lo mismo.
 *
 * El tono acompana: `verificado` en verde porque es la unica buena noticia,
 * `fusionado` neutro —no paso nada malo, es contabilidad— y `sin-prueba` en
 * aviso, que es lo que es: algo que nadie comprobo y quiza siga vivo.
 */
export const CLASE_EN_PANTALLA: Record<ClaseDeExtincion, { texto: string; clase: string }> = {
  verificado: {
    texto: 'verificado — un agente comprobo que ya no esta',
    clase: 'border-success/40 bg-success/10 text-success'
  },
  fusionado: {
    texto: 'fusionado — duplicado absorbido por otro hallazgo',
    clase: 'border-border bg-card text-muted-foreground'
  },
  'sin-prueba': {
    texto: 'cerrado sin prueba — nadie lo verifico',
    clase: 'border-medium/40 bg-medium/10 text-medium'
  }
}
