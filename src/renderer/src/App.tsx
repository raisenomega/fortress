const SEVERITIES = [
  { label: 'CRITICAL', className: 'bg-critical/15 text-critical border-critical/30' },
  { label: 'HIGH', className: 'bg-high/15 text-high border-high/30' },
  { label: 'MEDIUM', className: 'bg-medium/15 text-medium border-medium/30' },
  { label: 'LOW', className: 'bg-low/15 text-low border-low/30' },
  { label: 'CLEAN', className: 'bg-success/15 text-success border-success/30' }
] as const

/**
 * Pantalla de verificacion del tema OMEGA.
 * Se reemplaza por el layout real (Sidebar + TopBar + ChatWindow) en el paso 4.
 */
function App(): React.JSX.Element {
  return (
    <div className="h-full overflow-y-auto bg-background p-10">
      <header className="animate-[slideUp_0.25s_ease-out]">
        <h1 className="text-3xl text-primary">🏰 FORTRESS Command Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tema OMEGA · fondo negro · primary dorado · Syne + DM Sans
        </p>
      </header>

      <section className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base text-card-foreground">Tipografia</h3>
          <p className="mt-2 font-display text-xl">Syne · display</p>
          <p className="font-body text-sm text-muted-foreground">DM Sans · body</p>
        </article>

        <article className="glass rounded-lg border border-border p-5">
          <h3 className="text-base">Glass effect</h3>
          <p className="mt-2 text-sm text-muted-foreground">backdrop-filter: blur(8px)</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base">Tap feedback</h3>
          <button
            type="button"
            className="tap mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Pulsame
          </button>
        </article>
      </section>

      <section className="mt-6">
        <h2 className="text-lg">Escala de severidad</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEVERITIES.map((s) => (
            <span
              key={s.label}
              className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${s.className}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
