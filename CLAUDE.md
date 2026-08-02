# CLAUDE.md — FORTRESS Command Center

Reglas de construccion de ESTE proyecto. Complementan el CLAUDE.md raiz.

## Reglas de arquitectura (verificadas por ESLint, no negociables)

1. **Maximo 75 lineas por archivo.** Sin excepciones.
   Enforzado por `max-lines` en `eslint.config.mjs`.
2. **Maximo 50 lineas por funcion** (`max-lines-per-function`).
3. **Un componente por archivo.** El nombre del archivo == nombre del componente.
4. **Una funcion, una responsabilidad.**
5. Si un archivo crece de 75 lineas -> dividir en modulos, nunca subir el limite.

## Capas DDD

```
src/
├── domain/          Entidades, value objects, puertos (interfaces).
│                    CERO dependencias: ni Electron, ni React, ni SQLite.
│                    Compartido por main y renderer (solo tipos y logica pura).
├── application/     Casos de uso. Orquesta el dominio a traves de puertos.
│                    No conoce SQLite ni Anthropic, solo interfaces.
├── infrastructure/  Adaptadores concretos: SQLite, Anthropic SDK, dialogos
│                    de Electron, filesystem, git. Implementan los puertos.
└── presentation/    React. Solo UI y estado de UI (zustand). Habla con el
                     main process via el bridge tipado del preload.
```

Regla de dependencias: **hacia adentro**.
`presentation -> application -> domain` y `infrastructure -> domain`.
El dominio no importa de ninguna otra capa.

## Alias

`@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`, `@renderer/*`
Definidos en `electron.vite.config.ts` + `tsconfig.node.json` + `tsconfig.web.json`.

## Estilos

- Tema OMEGA de Raisen: fondo negro-navy, primary DORADO `38 85% 55%`.
- **Nunca colores hardcodeados.** Siempre tokens: `bg-primary`, `text-critical`,
  `border-border`, o `hsl(var(--primary) / 0.5)` para opacidad.
- Fuentes: Syne (display, h1-h4) + DM Sans (body). Bundleadas, sin CDN.
- Los modulos de `src/presentation/styles/` tambien respetan el limite de 75 lineas.

## Seguridad

- `contextIsolation: true`, `nodeIntegration: false`. El renderer nunca toca Node.
- Las llamadas a la API de Claude salen del **main process**, jamas del renderer:
  la API key no cruza el bridge.
- La API key se guarda cifrada con `safeStorage` de Electron, nunca en el codigo
  ni en el repo (R1).
- CSP declarada en `src/renderer/index.html`; no relajarla sin justificacion escrita.

## Verificacion antes de cada commit

```bash
npm run typecheck   # tsc en node + web
npm run lint        # incluye max-lines y no-explicit-any
npm run build       # electron-vite build
```
