import React from "react";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import CustomTooltip from "./CustomTooltip";
import { getStatusTag } from "../utils/status";

export default function DayDetailModal() {
  const {
    selectedDayDetail,
    setSelectedDayDetail,
    calMonth,
    calYear,
  } = useApp();

  if (!selectedDayDetail) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-[98%] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 text-[10px]">
        <header className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3 text-sm font-black uppercase tracking-tighter">
            <CalendarDays size={20} className="text-indigo-400" /> Hết hạn ngày{" "}
            {selectedDayDetail.day}/{calMonth}/{calYear}
          </div>
          <button
            onClick={() => setSelectedDayDetail(null)}
            className="p-2 hover:bg-white/10 rounded-full transition-all font-black text-xs uppercase flex items-center gap-2 group"
          >
            Đóng{" "}
            <ChevronLeft
              size={16}
              className="rotate-180 transition-transform group-hover:translate-x-1"
            />
          </button>
        </header>
        <div className="flex-1 overflow-x-auto overflow-y-auto p-2 text-[10px]">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
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
                <th className="px-3 py-2 w-28">Vùng Quản Lý</th>
                <th className="px-3 py-2 w-24 text-center">Ngày Ký</th>
                <th className="px-3 py-2 w-24 text-center">Ngày Cập Nhật</th>
                <th className="px-3 py-2 w-24 text-center">Hết hạn cũ</th>
                <th className="px-3 py-2 w-24 text-center">Hết hạn mới</th>
                <th className="px-3 py-2 w-[300px]">Địa chỉ liên hệ</th>
                <th className="px-3 py-2 text-center w-24">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {selectedDayDetail.data.map((item, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
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
                  <td className="px-3 py-2 uppercase text-emerald-600 font-black">
                    {item._area}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
