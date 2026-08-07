import { Fragment } from 'react'

const CODE = 'rounded bg-secondary/60 px-1 font-mono text-[0.9em] text-foreground'

/**
 * Formato inline SEGURO: **negrita** y `codigo`. No genera HTML ni usa
 * dangerouslySetInnerHTML — solo nodos React, asi el contenido de un .md no
 * puede inyectar markup.
 */
export function renderInline(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className={CODE}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
