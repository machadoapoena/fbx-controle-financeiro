import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination buttons with ellipsis
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none">
      {/* Left: Summary Metrics & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-4 text-slate-500">
        <span className="font-medium">
          {totalItems === 0 ? (
            "Nenhum registro"
          ) : (
            <>
              Exibindo <span className="font-bold text-slate-700">{startIndex}</span> a{" "}
              <span className="font-bold text-slate-700">{endIndex}</span> de{" "}
              <span className="font-bold text-slate-800">{totalItems}</span> registros
            </>
          )}
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-slate-300">
          <label htmlFor="page-size-select" className="text-slate-500 text-[11px] font-medium">
            Linhas por página:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#009d7a] focus:ring-1 focus:ring-[#009d7a]/20 cursor-pointer shadow-xs"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="Primeira página"
          title="Primeira página"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors cursor-pointer shadow-xs"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          title="Página anterior"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-700 transition-colors font-medium flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? "page" : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center cursor-pointer ${
                  isActive
                    ? "bg-[#0c2c40] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalItems === 0}
          aria-label="Próxima página"
          title="Próxima página"
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-700 transition-colors font-medium flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight size={15} />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || totalItems === 0}
          aria-label="Última página"
          title="Última página"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 transition-colors cursor-pointer shadow-xs"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
