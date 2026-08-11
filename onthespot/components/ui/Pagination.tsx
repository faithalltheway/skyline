function buildHref(searchParams: Record<string, string | string[] | undefined> | undefined, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === "page") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value != null) {
      params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `?${params.toString()}#main-content`;
}

export function Pagination({
  total,
  pageSize,
  currentPage,
  searchParams,
}: {
  total: number;
  pageSize: number;
  currentPage: number;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      <a
        href={currentPage > 1 ? buildHref(searchParams, currentPage - 1) : undefined}
        aria-disabled={currentPage <= 1}
        className="tap-target rounded-control border border-border px-3 py-2 text-sm font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-40 hover:bg-surface-muted"
      >
        Previous
      </a>
      <span className="px-3 text-sm text-neutral-500">
        Page {currentPage} of {totalPages}
      </span>
      <a
        href={currentPage < totalPages ? buildHref(searchParams, currentPage + 1) : undefined}
        aria-disabled={currentPage >= totalPages}
        className="tap-target rounded-control border border-border px-3 py-2 text-sm font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-40 hover:bg-surface-muted"
      >
        Next
      </a>
    </nav>
  );
}
