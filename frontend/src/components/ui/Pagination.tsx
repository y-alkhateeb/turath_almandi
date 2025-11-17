
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className = '',
  showFirstLast = true,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      // Adjust if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      // Add first page and ellipsis
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="التنقل بين الصفحات"
    >
      {/* First page button */}
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="
            px-3 py-2 rounded-lg border border-[var(--border-color)]
            text-sm font-medium text-[var(--text-primary)]
            hover:bg-[var(--bg-tertiary)] transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="الصفحة الأولى"
        >
          «
        </button>
      )}

      {/* Previous page button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          px-3 py-2 rounded-lg border border-[var(--border-color)]
          text-sm font-medium text-[var(--text-primary)]
          hover:bg-[var(--bg-tertiary)] transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label="الصفحة السابقة"
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-[var(--text-secondary)]"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isActive = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium
              transition-colors duration-200
              ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }
            `}
            aria-label={`الصفحة ${pageNumber}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* Next page button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          px-3 py-2 rounded-lg border border-[var(--border-color)]
          text-sm font-medium text-[var(--text-primary)]
          hover:bg-[var(--bg-tertiary)] transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        aria-label="الصفحة التالية"
      >
        ›
      </button>

      {/* Last page button */}
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="
            px-3 py-2 rounded-lg border border-[var(--border-color)]
            text-sm font-medium text-[var(--text-primary)]
            hover:bg-[var(--bg-tertiary)] transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          aria-label="الصفحة الأخيرة"
        >
          »
        </button>
      )}
    </nav>
  );
}
