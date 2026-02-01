import React from "react";
import { RefreshCw } from "lucide-react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DayDetailModal from "./components/DayDetailModal";
import MonthDetailModal from "./components/MonthDetailModal";
import Dashboard from "./pages/Dashboard";
import DashboardHomeClinic from "./pages/DashboardHomeClinic";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";

function AppContent() {
  const { view, isProcessing } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans text-[11px]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden ml-52">
        <Header />

        <div className="flex-1 overflow-y-auto p-3 bg-slate-50 relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm text-center">
              <RefreshCw
                className="text-indigo-600 animate-spin mb-2"
                size={32}
              />
              <p className="font-black text-indigo-800 uppercase tracking-widest text-[9px]">
                Đang trích xuất dữ liệu đa nguồn...
              </p>
            </div>
          )}

          {view === "dashboard" && <Dashboard />}
          {view === "homeClinic" && <DashboardHomeClinic />}
          {view === "calendar" && <Calendar />}
          {view === "categories" && <Categories />}
        </div>
      </main>

      <DayDetailModal />
      <MonthDetailModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
