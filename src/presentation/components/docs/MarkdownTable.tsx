import { renderInline } from './markdown-inline'

/** Una tabla del markdown del chat (PASO 96): filas ya sin la separadora.
 *  La primera fila hace de cabecera. Solo nodos React, como toda la familia. */
export function MarkdownTable({ filas }: { readonly filas: readonly string[] }): React.JSX.Element {
  const celdas = (fila: string): string[] =>
    fila
      .replace(/^\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
  const [cabecera, ...cuerpo] = filas
  return (
    <table className="my-1 w-full border-collapse text-left">
      <thead>
        <tr>
          {celdas(cabecera ?? '').map((c, i) => (
            <th key={i} className="border border-border px-2 py-1 font-semibold text-foreground">
              {renderInline(c.trim())}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cuerpo.map((fila, f) => (
          <tr key={f}>
            {celdas(fila).map((c, i) => (
              <td key={i} className="border border-border px-2 py-1 align-top">
                {renderInline(c.trim())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
