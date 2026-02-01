import React, { useMemo } from "react";
import { CalendarDays, Activity } from "lucide-react";
import { useApp } from "../context/AppContext";
import CustomTooltip from "../components/CustomTooltip";

export default function Calendar() {
  const {
    activeSession,
    calMonth,
    setCalMonth,
    calYear,
    setCalYear,
    calArea,
    setCalArea,
    allAreasInSession,
    setSelectedDayDetail,
    setSelectedMonthDetail,
  } = useApp();

  // Thuê bao hết hạn trong tháng/năm và khu vực đã chọn
  const calendarData = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.data.filter((item) => {
      const date = new Date(item._expiryTs);
      const inMonthYear =
        date.getMonth() + 1 === Number(calMonth) &&
        date.getFullYear() === Number(calYear);
      const inArea = calArea === "Tất cả" || item._area === calArea;
      return inMonthYear && inArea;
    });
  }, [activeSession, calMonth, calYear, calArea]);

  if (!activeSession) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-300 pb-10 text-[10px]">
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
              Tháng:
            </span>
            <select
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1"
              value={calMonth}
              onChange={(e) => setCalMonth(Number(e.target.value))}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold"
              value={calYear}
              onChange={(e) => setCalYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
              Khu vực:
            </span>
            <select
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold uppercase"
              value={calArea}
              onChange={(e) => setCalArea(e.target.value)}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {allAreasInSession.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            calendarData.length > 0 && setSelectedMonthDetail(calendarData)
          }
          disabled={calendarData.length === 0}
          className="text-[12px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 uppercase flex items-center gap-2 hover:bg-rose-100 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-50"
        >
          <Activity size={12} /> Tổng số thuê bao hết hạn:{" "}
          <span className="font-black text-rose-700">{calendarData.length}</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 [&>div]:min-w-0">
        {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map(
          (d) => (
            <div
              key={d}
              className="bg-slate-800 text-white py-1.5 px-1 text-center font-black uppercase text-[13px] rounded-lg tracking-widest flex items-center justify-center h-8"
            >
              {d}
            </div>
          )
        )}
        {Array.from({
          length:
            (new Date(Number(calYear), Number(calMonth) - 1, 1).getDay() + 6) % 7,
        }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="bg-slate-50 rounded-lg border border-dashed border-slate-200 opacity-40 aspect-[5/2] min-h-[1.5rem]"
          />
        ))}
        {(() => {
          const emptyCount =
            (new Date(Number(calYear), Number(calMonth) - 1, 1).getDay() + 6) % 7;
          return Array.from({
            length: new Date(Number(calYear), Number(calMonth), 0).getDate(),
          }).map((_, i) => {
          const day = i + 1;
          const col = (emptyCount + i) % 7;
          const showTooltipLeft = col >= 5;
          const dayData = calendarData.filter(
            (item) => new Date(item._expiryTs).getDate() === day
          );
          const hasData = dayData.length > 0;
          const today = new Date();
          const isToday =
            day === today.getDate() &&
            Number(calMonth) === today.getMonth() + 1 &&
            Number(calYear) === today.getFullYear();
          const tooltipContent = hasData
            ? (() => {
                const byArea = {};
                dayData.forEach((item) => {
                  const a = item._area || "Chưa phân loại";
                  byArea[a] = (byArea[a] || 0) + 1;
                });
                const areaStyles = [
                  { text: "text-indigo-600", badge: "bg-indigo-100 text-indigo-700" },
                  { text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
                  { text: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
                  { text: "text-rose-600", badge: "bg-rose-100 text-rose-700" },
                  { text: "text-violet-600", badge: "bg-violet-100 text-violet-700" },
                  { text: "text-sky-600", badge: "bg-sky-100 text-sky-700" },
                  { text: "text-teal-600", badge: "bg-teal-100 text-teal-700" },
                  { text: "text-orange-600", badge: "bg-orange-100 text-orange-700" },
                ];
                return (
                  <div className="space-y-2 py-0.5">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200 pb-1 mb-1">
                      Thuê bao hết hạn theo khu vực
                    </div>
                    {Object.entries(byArea).map(([area, count], i) => {
                      const { text, badge } = areaStyles[i % areaStyles.length];
                      return (
                        <div
                          key={area}
                          className="flex items-center justify-between gap-3 text-[11px] font-semibold"
                        >
                          <span className={`${text} break-words`}>{area}</span>
                          <span className={`px-2 py-0.5 rounded-md font-black shrink-0 ${badge}`}>
                            {count} TB
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            : null;
          const dayCell = (
            <div
              onClick={() => hasData && setSelectedDayDetail({ day, data: dayData })}
              className={`group relative w-full h-full min-h-[1.5rem] p-3 rounded-lg border transition-all flex flex-col justify-between cursor-pointer 
                ${
                  isToday
                    ? "border-[3px] border-red-500 bg-red-50 shadow-inner ring-4 ring-red-500/10"
                    : hasData
                    ? "bg-white border-blue-400 hover:shadow-md hover:border-blue-500 ring-offset-1 hover:ring-2 ring-indigo-100"
                    : "bg-transparent border-slate-200 hover:border-slate-300"
                }`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`font-black text-[20px] leading-none ${
                    isToday
                      ? "text-red-700"
                      : hasData
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="bg-red-500 text-white text-[13px] px-1 py-0.5 rounded font-black uppercase tracking-tighter shadow-sm animate-pulse">
                    Hôm nay
                  </span>
                )}
              </div>
              {hasData && (
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[14px] font-black leading-none ${
                      isToday ? "text-red-800" : "text-indigo-600"
                    }`}
                  >
                    {dayData.length}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase mt-0.5 tracking-tighter ${
                      isToday ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    TB cần gia hạn
                  </span>
                </div>
              )}
            </div>
          );
          return (
            <div key={day} className="min-w-0 aspect-[3/2] min-h-[1.5rem]">
              {hasData ? (
                <CustomTooltip
                  content={tooltipContent}
                  maxWidth="max-w-[320px]"
                  minWidth="min-w-[240px]"
                  fill
                  placement={showTooltipLeft ? "left" : "right"}
                >
                  {dayCell}
                </CustomTooltip>
              ) : (
                dayCell
              )}
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}
