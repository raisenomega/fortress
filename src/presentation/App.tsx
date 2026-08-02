/** Raiz de la UI. El layout real (Sidebar + TopBar + ChatWindow) llega en el paso 4. */
export function App(): React.JSX.Element {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="animate-[slideUp_0.25s_ease-out] text-center">
        <h1 className="text-3xl text-primary">🏰 FORTRESS Command Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tema OMEGA activo · arquitectura DDD lista
        </p>
      </div>
    </div>
  )
}
