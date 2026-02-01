import React from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Home,
  CalendarDays,
  Map,
  FileText,
  Trash2,
  CheckCircle,
  Play,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Sidebar() {
  const {
    view,
    setView,
    reportSessionsPharmacy,
    reportSessionsHomeClinic,
    activePharmacySessionId,
    setActivePharmacySessionId,
    activeHomeClinicSessionId,
    setActiveHomeClinicSessionId,
    calendarServiceType,
    setCalendarServiceType,
    setSelectedArea,
    setDetailPage,
    setCommunePage,
    pendingData,
    pendingFileName,
    pendingForView,
    handleAnalyze,
    removeSession,
  } = useApp();

  const showPendingSubmit =
    pendingData &&
    ((view === "dashboard" && pendingForView === "pharmacy") ||
      (view === "homeClinic" && pendingForView === "homeClinic"));

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 shadow-2xl z-30">
      <div className="p-3 border-b border-slate-800 flex items-center gap-2">
        <ShieldCheck className="text-indigo-400" size={18} />
        <div>
          <span className="font-bold text-xs block leading-none uppercase tracking-tighter">
            VNPT AUDITOR
          </span>
          <span className="text-[7px] text-slate-500 uppercase mt-1 block font-black tracking-widest italic tracking-tighter leading-none">
            v22.0 Fixed
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-2 border-t border-slate-800 space-y-4">
        <div>
          <div className="px-2 pb-1 text-[12px] font-black text-slate-500 uppercase tracking-widest">
            Pharmacy
          </div>
          <div className="space-y-0.5 mt-1">
            <button
              onClick={() => setView("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all ${
                view === "dashboard" && !activePharmacySessionId
                  ? "bg-indigo-600 text-white font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard size={13} /> Thống kê dữ liệu
            </button>
            <button
              onClick={() => {
                setCalendarServiceType("pharmacy");
                setView("calendar");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all ${
                view === "calendar" && calendarServiceType === "pharmacy"
                  ? "bg-indigo-600 text-white font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <CalendarDays size={13} /> Lịch hết hạn
            </button>
          </div>
          <div className="px-2 pb-1 mt-2 text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Phiên Báo cáo</span>
            <span className="bg-slate-800 px-1 rounded text-white">
              {reportSessionsPharmacy.length}
            </span>
          </div>
          <div className="space-y-0.5 mt-1">
            {reportSessionsPharmacy.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActivePharmacySessionId(session.id);
                  setSelectedArea(null);
                  setDetailPage(1);
                  setView("dashboard");
                }}
                className={`group relative p-1.5 rounded-md cursor-pointer transition-all border ${
                  activePharmacySessionId === session.id
                    ? "bg-indigo-900/40 border-indigo-500/50"
                    : "border-transparent hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText
                    size={12}
                    className={
                      activePharmacySessionId === session.id
                        ? "text-indigo-400"
                        : "text-slate-500"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[12px] font-black truncate uppercase tracking-tighter ${
                        activePharmacySessionId === session.id
                          ? "text-white"
                          : "text-slate-300"
                      }`}
                    >
                      {session.fileName}
                    </p>
                    <p className="text-[12px] text-slate-600 font-bold uppercase mt-0.5">
                      {session.site} • {session.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(session.id, "pharmacy");
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="px-2 pb-1 text-[12px] font-black text-slate-500 uppercase tracking-widest">
            Home&Clinic
          </div>
          <div className="space-y-0.5 mt-1">
            <button
              onClick={() => setView("homeClinic")}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all ${
                view === "homeClinic" && !activeHomeClinicSessionId
                  ? "bg-indigo-600 text-white font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Home size={13} /> Thống kê dữ liệu
            </button>
            <button
              onClick={() => {
                setCalendarServiceType("homeClinic");
                setView("calendar");
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all ${
                view === "calendar" && calendarServiceType === "homeClinic"
                  ? "bg-indigo-600 text-white font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <CalendarDays size={13} /> Lịch hết hạn
            </button>
          </div>
          <div className="px-2 pb-1 mt-2 text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
            <span>Phiên Báo cáo</span>
            <span className="bg-slate-800 px-1 rounded text-white">
              {reportSessionsHomeClinic.length}
            </span>
          </div>
          <div className="space-y-0.5 mt-1">
            {reportSessionsHomeClinic.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveHomeClinicSessionId(session.id);
                  setSelectedArea(null);
                  setDetailPage(1);
                  setView("homeClinic");
                }}
                className={`group relative p-1.5 rounded-md cursor-pointer transition-all border ${
                  activeHomeClinicSessionId === session.id
                    ? "bg-indigo-900/40 border-indigo-500/50"
                    : "border-transparent hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText
                    size={12}
                    className={
                      activeHomeClinicSessionId === session.id
                        ? "text-indigo-400"
                        : "text-slate-500"
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[12px] font-black truncate uppercase tracking-tighter ${
                        activeHomeClinicSessionId === session.id
                          ? "text-white"
                          : "text-slate-300"
                      }`}
                    >
                      {session.fileName}
                    </p>
                    <p className="text-[12px] text-slate-600 font-bold uppercase mt-0.5">
                      {session.site} • {session.timestamp}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(session.id, "homeClinic");
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="px-2 pb-1 text-[12px] font-black text-slate-500 uppercase tracking-widest">
            Hệ thống
          </div>
          <div className="space-y-0.5 mt-1">
            <button
              onClick={() => {
                setView("categories");
                setCommunePage(1);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all ${
                view === "categories"
                  ? "bg-indigo-600 text-white font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Map size={13} /> Danh mục Xã
            </button>
          </div>
        </div>
      </div>

      {showPendingSubmit && (
        <div className="m-2 p-2 bg-orange-600/10 rounded-lg border-2 border-orange-500/40 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle size={14} className="text-orange-500" />
            <p className="text-[9px] font-black text-white uppercase truncate">
              {pendingFileName}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1.5 rounded font-black uppercase text-[9px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play size={12} /> Submit Phân tích
          </button>
        </div>
      )}
    </aside>
  );
}
