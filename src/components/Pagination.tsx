interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center h-7 w-7 rounded text-[13px] text-[#475569] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        ←
      </button>

      <span className="px-3 py-1 text-[13px] text-[#475569] tabular-nums select-none">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center h-7 w-7 rounded text-[13px] text-[#475569] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  )
}
