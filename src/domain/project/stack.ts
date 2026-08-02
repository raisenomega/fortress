/** Pistas recogidas del filesystem. El dominio no lee disco: solo decide. */
export interface StackEvidence {
  /** Nombres de archivo presentes en la raiz del proyecto. */
  readonly files: readonly string[]
  /** Dependencias declaradas (npm, pip, ...), en minusculas. */
  readonly dependencies: readonly string[]
}

/** El primer patron que coincide gana, por eso van de mas especifico a menos. */
const BY_DEPENDENCY: ReadonlyArray<readonly [string, string]> = [
  ['next', 'Next.js'],
  ['@nestjs/core', 'NestJS'],
  ['nuxt', 'Nuxt'],
  ['svelte', 'Svelte'],
  ['vue', 'Vue'],
  ['electron', 'Electron'],
  ['react', 'React'],
  ['fastapi', 'FastAPI'],
  ['django', 'Django'],
  ['flask', 'Flask'],
  ['express', 'Express'],
  ['fastify', 'Fastify'],
  ['@supabase/supabase-js', 'Supabase'],
  ['supabase', 'Supabase'],
  ['prisma', 'Prisma']
]

const BY_FILE: ReadonlyArray<readonly [string, string]> = [
  ['go.mod', 'Go'],
  ['cargo.toml', 'Rust'],
  ['composer.json', 'PHP'],
  ['gemfile', 'Ruby'],
  ['pom.xml', 'Java'],
  ['build.gradle', 'Java'],
  ['pyproject.toml', 'Python'],
  ['requirements.txt', 'Python'],
  ['package.json', 'Node.js']
]

const MAX_LABELS = 3

function matches(
  rules: ReadonlyArray<readonly [string, string]>,
  present: readonly string[]
): string[] {
  return rules.filter(([key]) => present.includes(key)).map(([, label]) => label)
}

/** Etiqueta legible del stack, o cadena vacia si no se reconoce nada. */
export function detectStack(evidence: StackEvidence): string {
  const files = evidence.files.map((file) => file.toLowerCase())
  const dependencies = evidence.dependencies.map((dep) => dep.toLowerCase())

  const labels = [...matches(BY_DEPENDENCY, dependencies), ...matches(BY_FILE, files)]
  const unique = [...new Set(labels)]

  // Si ya hay un framework identificado, "Node.js" no aporta nada.
  const refined = unique.length > 1 ? unique.filter((label) => label !== 'Node.js') : unique

  return refined.slice(0, MAX_LABELS).join(' + ')
}
