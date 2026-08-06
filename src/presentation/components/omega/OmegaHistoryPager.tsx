interface OmegaHistoryPagerProps {
  readonly page: number
  readonly pages: number
  readonly onPage: (page: number) => void
}

/** Paginacion del historial; no aparece con una sola pagina. */
export function OmegaHistoryPager({
  page,
  pages,
  onPage
}: OmegaHistoryPagerProps): React.JSX.Element | null {
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <button type="button" className="tap" disabled={page === 0} onClick={() => onPage(page - 1)}>
        ‹ Anterior
      </button>
      <span>
        {page + 1} / {pages}
      </span>
      <button
        type="button"
        className="tap"
        disabled={page + 1 >= pages}
        onClick={() => onPage(page + 1)}
      >
        Siguiente ›
      </button>
    </div>
  )
}
