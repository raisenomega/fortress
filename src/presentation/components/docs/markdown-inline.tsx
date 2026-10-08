import { Fragment } from 'react'
import { partesConEnlace } from './markdown-links'

const CODE = 'rounded bg-secondary/60 px-1 font-mono text-[0.9em] text-foreground'
const LINK = 'text-primary underline underline-offset-2 hover:text-primary-hover'

/** **negrita** y `codigo`, como siempre: solo nodos React. */
function formato(text: string, base: number): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={base + i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={base + i} className={CODE}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={base + i}>{part}</Fragment>
  })
}

/**
 * Formato inline SEGURO: enlaces web, **negrita** y `codigo`. No genera HTML ni
 * usa dangerouslySetInnerHTML — solo nodos React, asi el contenido de un .md no
 * puede inyectar markup. El <a> solo existe para esquemas web (candado en
 * `partesConEnlace`); el clic lo intercepta y gatea el will-navigate de
 * main-window (shell.openExternal, nunca navegar la app).
 */
export function renderInline(text: string): React.ReactNode {
  return partesConEnlace(text).map((parte, i) =>
    parte.tipo === 'link' ? (
      <a key={i} href={parte.url} className={LINK} title={parte.url}>
        {parte.texto}
      </a>
    ) : (
      <Fragment key={i}>{formato(parte.texto, i * 1000)}</Fragment>
    )
  )
}
