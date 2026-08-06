interface ConfigDocPreviewProps {
  readonly name: string
  readonly content: string | undefined
}

/** El borrador del documento actual, o el aviso de que aun no llego del agente. */
export function ConfigDocPreview({ name, content }: ConfigDocPreviewProps): React.JSX.Element {
  return (
    <div className="mt-2">
      <p className="font-mono text-xs text-foreground">{name}</p>
      {content ? (
        <pre className="mt-1 max-h-48 overflow-y-auto rounded border border-border bg-background/50 p-2 text-[11px] break-words whitespace-pre-wrap text-muted-foreground">
          {content}
        </pre>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Esperando la propuesta del agente. Responde sus preguntas en el chat.
        </p>
      )}
    </div>
  )
}
