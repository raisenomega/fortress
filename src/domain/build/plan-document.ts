/** Formatea el plan como documento markdown para guardarlo junto al proyecto. */
export function planDocument(
  projectName: string,
  intent: string,
  plan: string,
  whenIso: string
): string {
  return [
    `# Plan FORTRESS — ${projectName}`,
    '',
    `> Generado: ${whenIso}`,
    '',
    '## Intencion',
    '',
    intent,
    '',
    '## Plan',
    '',
    plan,
    ''
  ].join('\n')
}
