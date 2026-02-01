import React from "react";
import { Search, MapPin, FileUp, FileDown, CloudDownload } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Header() {
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
    <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm text-[10px]">
      <div className="flex items-center gap-4">
        <h1 className="font-black text-slate-800 uppercase tracking-tighter text-xs">
          {title}
        </h1>
        {view === "dashboard" && (
          <div className="flex items-center gap-1.5 bg-emerald-50/60 p-1 rounded-lg border border-emerald-200 shadow-inner transition-colors flex-wrap">
            <div className="flex items-center gap-1 px-2 border-r border-emerald-200/50">
              <MapPin size={10} className="text-emerald-500" />
              <select
                className="bg-transparent border-none text-[12px] font-medium text-emerald-800 outline-none cursor-pointer min-w-[60px]"
                value={importSite}
                onChange={(e) => setImportSite(e.target.value)}
              >
                <option value="">Chọn Site</option>
                {availableSites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <label
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-black uppercase cursor-pointer transition-all ${
                pendingData
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50"
              }`}
            >
              <FileUp size={12} /> {pendingData ? "Đã nạp" : "Import Excel"}
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "biz")}
              />
            </label>
            <div className="flex items-center gap-1 border-l border-emerald-200/50 pl-2">
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Sheet:</span>
              <button
                type="button"
                onClick={() => loadPharmacyFromSheet("LAN")}
                disabled={!!loadingPharmacySheetSite}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CloudDownload size={10} />
                {loadingPharmacySheetSite === "LAN" ? "Đang tải…" : "LAN"}
              </button>
              <button
                type="button"
                onClick={() => loadPharmacyFromSheet("TNH")}
                disabled={!!loadingPharmacySheetSite}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CloudDownload size={10} />
                {loadingPharmacySheetSite === "TNH" ? "Đang tải…" : "TNH"}
              </button>
            </div>
          </div>
        )}
        {view === "homeClinic" && (
          <div className="flex items-center gap-1.5 bg-emerald-50/60 p-1 rounded-lg border border-emerald-200 shadow-inner transition-colors">
            <label
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-black uppercase cursor-pointer transition-all ${
                pendingData
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-50"
              }`}
            >
              <FileUp size={12} /> {pendingData ? "Đã nạp" : "Import Excel"}
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "biz")}
              />
            </label>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {activeSession && (
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileDown size={12} /> Xuất Excel
          </button>
        )}
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={12}
          />
          <input
            type="text"
            placeholder="Tìm MST, HĐ, Khách hàng..."
            className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-lg text-[10px] w-64 outline-none font-bold focus:ring-1 ring-indigo-300 transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDetailPage(1);
            }}
          />
        </div>
      </div>
    </header>
  );
}
