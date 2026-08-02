import type { CognitionReflection } from './cognition-log'
import type { Section } from './sections'

/**
 * "SESION 2026-08-02 · Nucleo". Se exige una fecha con digitos porque la
 * plantilla se titula "SESION [FECHA] · [PROYECTO]" y colarla como reflexion
 * real llenaria el panel de sesiones que nunca ocurrieron.
 */
const SESION = /^SESI[OÓ]N\s+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*[·|-]?\s*(.*)$/i

const MAX_BODY = 600

export function parseReflections(sections: readonly Section[]): readonly CognitionReflection[] {
  const found: CognitionReflection[] = []

  for (const section of sections) {
    const match = SESION.exec(section.heading.trim())
    if (!match) continue

    found.push({
      session: match[1],
      project: match[2].trim(),
      body: section.body.trim().slice(0, MAX_BODY)
    })
  }

  // Las mas recientes primero: el panel ensena las ultimas cinco.
  return found.reverse()
}
