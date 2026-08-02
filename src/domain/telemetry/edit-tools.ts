/**
 * Herramientas con las que el agente escribe de verdad en el proyecto. De
 * aqui salen los "fixes aplicados": no se cuenta lo que el agente dijo que
 * hizo, sino lo que el CLI reporto que ejecuto.
 */
const EDIT_TOOLS: ReadonlySet<string> = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

export function countEdits(tools: readonly string[]): number {
  return tools.filter((tool) => EDIT_TOOLS.has(tool)).length
}

export function isEditTool(tool: string): boolean {
  return EDIT_TOOLS.has(tool)
}
