import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, MapPin, FileDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import CustomTooltip from "./CustomTooltip";
import { getStatusTag } from "../utils/status";
import { exportToExcel } from "../utils/excel";

const AREA_STYLES = [
  { text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { text: "text-amber-600", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  { text: "text-rose-600", badge: "bg-rose-100 text-rose-700 border-rose-200" },
  { text: "text-violet-600", badge: "bg-violet-100 text-violet-700 border-violet-200" },
  { text: "text-sky-600", badge: "bg-sky-100 text-sky-700 border-sky-200" },
  { text: "text-teal-600", badge: "bg-teal-100 text-teal-700 border-teal-200" },
  { text: "text-orange-600", badge: "bg-orange-100 text-orange-700 border-orange-200" },
];

function SubscriberRow({ item, idx }) {
  return (
    <tr className="hover:bg-indigo-50/50 transition-colors">
      <td className="px-2 py-1.5 text-center text-slate-400 font-normal">
        {idx + 1}
      </td>
      <td className="px-2 py-1.5 text-slate-500 italic text-center">
        {item._id}
      </td>
      <td className="px-3 py-2 text-slate-800 font-semibold uppercase truncate">
        <CustomTooltip content={item._customer} maxWidth="max-w-[360px]">
          <span className="truncate block max-w-[200px] font-bold">
            {item._customer}
          </span>
        </CustomTooltip>
      </td>
      <td className="px-3 py-2 text-indigo-500 font-black tracking-widest text-center">
        {item._phone}
      </td>
      <td className="px-3 py-2 text-amber-700 font-black tracking-tighter text-center">
        {item._taxId}
      </td>
      <td className="px-3 py-2 text-slate-500 truncate text-center">
        {item._subIdDhs}
      </td>
      <td className="px-3 py-2 text-slate-500 text-center font-medium">
        {item._signingDate}
      </td>
      <td className="px-3 py-2 text-slate-400 text-center font-medium">
        {item._updateDate}
      </td>
      <td className="px-3 py-2 text-rose-400 text-center font-medium bg-rose-50/20">
        {item._prevExpiryDate}
      </td>
      <td className="px-3 py-2 text-indigo-800 text-center font-black bg-indigo-50/40">
        {item._expiryDate}
      </td>
      <td className="px-3 py-2 text-slate-400 italic leading-tight font-normal truncate">
        <CustomTooltip content={item._address} maxWidth="max-w-[420px]">
          <span className="truncate block max-w-[280px]">
            {item._address}
          </span>
        </CustomTooltip>
      </td>
      <td className="px-3 py-2 text-center">
        <span
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusTag(
            item._status,
            item._isActive
          )}`}
        >
          {item._status}
        </span>
      </td>
    </tr>
  );
}

export default function MonthDetailModal() {
  const {
    selectedMonthDetail,
    setSelectedMonthDetail,
    calMonth,
    calYear,
  } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!selectedMonthDetail?.length) return;
    setIsExporting(true);
    exportToExcel(
      selectedMonthDetail,
      `het-han-thang-${calMonth}-${calYear}`
    )
      .catch((err) => alert(err?.message || "Xuất Excel thất bại."))
      .finally(() => setIsExporting(false));
  };

  const groupedByArea = useMemo(() => {
    if (!selectedMonthDetail?.length) return [];
    const byArea = {};
    selectedMonthDetail.forEach((item) => {
      const area = item._area || "Chưa phân loại";
      if (!byArea[area]) byArea[area] = [];
      byArea[area].push(item);
    });
    return Object.entries(byArea).sort((a, b) => a[0].localeCompare(b[0]));
  }, [selectedMonthDetail]);

  if (!selectedMonthDetail?.length) return null;

  const total = selectedMonthDetail.length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-[98%] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 text-[10px]">
        <header className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-tighter">
            <CalendarDays size={20} className="text-indigo-400" /> Hết hạn tháng{" "}
            {calMonth}/{calYear} — Tổng {total} thuê bao
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={12} /> {isExporting ? "Đang xuất..." : "Xuất Excel"}
            </button>
            <button
              onClick={() => setSelectedMonthDetail(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-all font-black text-xs uppercase flex items-center gap-2 group"
            >
              Đóng{" "}
              <ChevronLeft
                size={16}
                className="rotate-180 transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-x-auto overflow-y-auto p-2 text-[10px]">
          {groupedByArea.map(([area, items], areaIdx) => {
            const style = AREA_STYLES[areaIdx % AREA_STYLES.length];
            return (
              <section
                key={area}
                className="mb-6 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm"
              >
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 ${style.badge} border`}
                >
                  <MapPin size={16} className="shrink-0" />
                  <span className={`font-black uppercase tracking-tighter ${style.text}`}>
                    {area}
                  </span>
                  <span className="ml-auto font-black text-slate-600">
                    {items.length} thuê bao
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="px-2 py-2 w-10 text-center">STT</th>
                        <th className="px-2 py-2 w-16 text-center">Mã HĐ</th>
                        <th className="px-3 py-2 w-[220px]">Khách Hàng</th>
                        <th className="px-3 py-2 w-32 text-center text-indigo-600">
                          SĐT
                        </th>
                        <th className="px-3 py-2 w-32 text-center text-amber-700 font-bold">
                          MST
                        </th>
                        <th className="px-3 py-2 w-32 text-center">Mã TB DHSX</th>
                        <th className="px-3 py-2 w-24 text-center">Ngày Ký</th>
                        <th className="px-3 py-2 w-24 text-center">Ngày Cập Nhật</th>
                        <th className="px-3 py-2 w-24 text-center">Hết hạn cũ</th>
                        <th className="px-3 py-2 w-24 text-center">Hết hạn mới</th>
                        <th className="px-3 py-2 w-[300px]">Địa chỉ liên hệ</th>
                        <th className="px-3 py-2 text-center w-24">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {items.map((item, idx) => (
                        <SubscriberRow key={idx} item={item} idx={idx} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
