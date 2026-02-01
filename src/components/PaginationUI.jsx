import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ITEMS_PER_PAGE } from "../constants";

const PaginationUI = ({ current, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2 bg-white border-t border-slate-100 mt-auto shadow-inner">
      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tighter">
        Trang {current}/{totalPages} ({totalItems.toLocaleString()})
      </span>
      <div className="flex gap-1">
        <button
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
          className="p-1 rounded bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-200"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          disabled={current === totalPages}
          onClick={() => onPageChange(current + 1)}
          className="p-1 rounded bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-200"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaginationUI;
