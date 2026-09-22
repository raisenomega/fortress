import { register } from 'node:module'

/** `node --import ./scripts/lib/cargar-ts.mjs scripts/x.ts`: alias y extensiones de `src`. */
register('./resolver-ts.mjs', import.meta.url)
