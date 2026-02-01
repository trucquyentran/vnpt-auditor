import React from "react";
import { Search, MapPin, FileUp, FileDown, CloudDownload, Menu } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Header({ onMenuClick }) {
  const {
    view,
    activeSession,
    importSite,
    setImportSite,
    availableSites,
    searchTerm,
    setSearchTerm,
    setDetailPage,
    handleFileUpload,
    handleExportExcel,
    pendingData,
    loadPharmacyFromSheet,
    loadingPharmacySheetSite,
  } = useApp();

  const title =
    view === "calendar"
      ? "Phân bổ theo lịch"
      : view === "categories"
      ? "Quản lý danh mục"
      : view === "dashboard"
      ? "Phân loại dịch vụ Pharmacy"
      : view === "homeClinic"
      ? "Phân loại dịch vụ Home&Clinic"
      : activeSession
      ? activeSession.fileName
      : "Trung tâm phân tích";

  return (
    <header className="min-h-0 sm:min-h-12 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-4 py-2 shrink-0 z-10 shadow-sm w-full">
      {/* Hàng 1 mobile: Menu + Tiêu đề (chữ nhỏ) */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 touch-manipulation shrink-0"
          aria-label="Mở menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-black text-slate-800 uppercase tracking-tighter text-[9px] sm:text-[10px] md:text-xs truncate min-w-0 leading-tight">
          {title}
        </h1>
      </div>

      {/* Hàng 2 mobile: Khối Site/Import/Sheet (full width, chữ nhỏ) */}
      {view === "dashboard" && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-1.5 bg-emerald-50/60 p-1.5 sm:p-1 rounded-lg border border-emerald-200 shadow-inner transition-colors w-full sm:w-auto sm:max-w-full min-w-0">
          <div className="flex items-center gap-1 px-1 sm:px-2 border-r border-emerald-200/50 shrink-0">
            <MapPin size={9} className="text-emerald-500 shrink-0 sm:w-[10px] sm:h-[10px]" />
            <select
              className="bg-transparent border-none text-[8px] sm:text-[10px] md:text-[12px] font-medium text-emerald-800 outline-none cursor-pointer min-w-0 max-w-[70px] sm:min-w-[50px] sm:max-w-none"
              value={importSite}
              onChange={(e) => setImportSite(e.target.value)}
            >
              <option value="">Site</option>
              {availableSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[10px] md:text-[12px] font-black uppercase cursor-pointer transition-all shrink-0 ${
              pendingData
                ? "bg-emerald-600 text-white"
                : "bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50"
            }`}
          >
            <FileUp size={10} className="shrink-0 sm:w-3 sm:h-3" /> {pendingData ? "Đã nạp" : "Import"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "biz")}
            />
          </label>
          <div className="flex items-center gap-1 border-l border-emerald-200/50 pl-1.5">
            <span className="text-[7px] sm:text-[9px] font-bold text-emerald-600 uppercase hidden sm:inline">Sheet:</span>
            <button
              type="button"
              onClick={() => loadPharmacyFromSheet("LAN")}
              disabled={!!loadingPharmacySheetSite}
              className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[8px] sm:text-[11px] font-black uppercase bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CloudDownload size={9} className="shrink-0 sm:w-2.5 sm:h-2.5" />
              {loadingPharmacySheetSite === "LAN" ? "…" : "LAN"}
            </button>
            <button
              type="button"
              onClick={() => loadPharmacyFromSheet("TNH")}
              disabled={!!loadingPharmacySheetSite}
              className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded text-[8px] sm:text-[11px] font-black uppercase bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CloudDownload size={9} className="shrink-0 sm:w-2.5 sm:h-2.5" />
              {loadingPharmacySheetSite === "TNH" ? "…" : "TNH"}
            </button>
          </div>
        </div>
      )}
      {view === "homeClinic" && (
        <div className="flex items-center gap-1.5 bg-emerald-50/60 p-1 rounded-lg border border-emerald-200 shadow-inner w-full sm:w-auto">
          <label
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-md text-[8px] sm:text-[12px] font-black uppercase cursor-pointer transition-all ${
              pendingData
                ? "bg-emerald-600 text-white"
                : "bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50"
            }`}
          >
            <FileUp size={10} /> {pendingData ? "Đã nạp" : "Import"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "biz")}
            />
          </label>
        </div>
      )}

      {/* Hàng 3 mobile: Tìm kiếm + Xuất Excel */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
        <div className="relative flex-1 min-w-0 max-w-full sm:max-w-[16rem] sm:w-64">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-3 h-3 sm:w-3 sm:h-3"
            size={12}
          />
          <input
            type="text"
            placeholder="Tìm MST, HĐ..."
            className="pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-1.5 bg-slate-100 border-none rounded-lg text-[8px] sm:text-[10px] w-full outline-none font-bold focus:ring-1 ring-indigo-300 transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDetailPage(1);
            }}
          />
        </div>
        {activeSession && (
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[11px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <FileDown size={10} className="shrink-0 sm:w-3 sm:h-3" /> Xuất
          </button>
        )}
      </div>
    </header>
  );
}
