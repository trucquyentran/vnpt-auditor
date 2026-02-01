import React, { useMemo, useState } from "react";
import { Upload, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getColumnValue } from "../utils/normalize";
import PaginationUI from "../components/PaginationUI";
import { ITEMS_PER_PAGE } from "../constants";

export default function Categories() {
  const {
    communeList,
    communePage,
    setCommunePage,
    handleFileUpload,
    loadDefaultCategoriesFromSheet,
  } = useApp();
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState(null);

  const handleLoadFromSheet = () => {
    setLoadingSheet(true);
    setSheetError(null);
    loadDefaultCategoriesFromSheet()
      .then((n) => {
        if (n > 0) setSheetError(null);
      })
      .catch((err) => setSheetError(err?.message || "Không tải được từ Google Sheet."))
      .finally(() => setLoadingSheet(false));
  };

  const paginatedCommunes = useMemo(() => {
    const start = (communePage - 1) * ITEMS_PER_PAGE;
    return communeList.slice(start, start + ITEMS_PER_PAGE);
  }, [communeList, communePage]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-10 px-0 sm:px-2">
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div className="min-w-0">
          <h3 className="font-black text-slate-800 uppercase text-[11px] sm:text-[12px]">
            Danh mục Đối soát
          </h3>
          <p className="text-slate-400 text-[11px] sm:text-[12px] italic">
            Đã nạp: {communeList.length.toLocaleString()} xã/phường.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleLoadFromSheet}
            disabled={loadingSheet}
            className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-black text-[12px] uppercase flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={loadingSheet ? "animate-spin" : ""} />
            {loadingSheet ? "Đang tải…" : "Lấy từ Google Sheet"}
          </button>
          <label className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-black text-[12px] cursor-pointer uppercase flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all">
            <Upload size={14} /> Nạp Danh mục
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "category")}
            />
          </label>
        </div>
      </div>
      {sheetError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-[12px] font-bold">
          {sheetError}
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col font-bold uppercase overflow-x-auto">
        <table className="w-full text-left text-[11px] sm:text-[12px] min-w-[480px]">
          <thead className="bg-slate-900 text-white text-[12px] uppercase tracking-widest border-b border-white/10">
            <tr>
              <th className="px-4 py-2">Xã/Phường</th>
              <th className="px-4 py-2">Quận/Huyện</th>
              <th className="px-4 py-2">Vùng gán</th>
              <th className="px-4 py-2 text-center w-20">Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-bold">
            {paginatedCommunes.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-1.5 text-slate-800">
                  {getColumnValue(c, ["Xã", "Tên xã", "Xa"])}
                </td>
                <td className="px-4 py-1.5 text-slate-400">
                  {getColumnValue(c, ["Huyện", "Thành phố", "Huyen"])}
                </td>
                <td className="px-4 py-2 text-indigo-600 uppercase">
                  {getColumnValue(c, ["Khu vực", "Vùng", "Khu vuc"])}
                </td>
                <td className="px-4 py-1.5 text-center text-slate-400 w-20">
                  {getColumnValue(c, ["Mã tỉnh", "Ma tinh", "Site"])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationUI
          current={communePage}
          totalItems={communeList.length}
          onPageChange={setCommunePage}
        />
      </div>
    </div>
  );
}
