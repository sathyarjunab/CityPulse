import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-3 sm:gap-4" aria-label="Pagination">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-5" aria-hidden />
        <span className="max-sm:sr-only">Previous</span>
      </Button>
      <p className="rounded-xl border-2 border-ink bg-white px-4 py-2 text-sm font-bold" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
        <span className="max-sm:sr-only">Next</span>
        <ChevronRight className="size-5" aria-hidden />
      </Button>
    </nav>
  );
}
