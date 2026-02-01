import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  Database,
  Activity,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Clock,
  ChevronRight,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import CustomTooltip from "../components/CustomTooltip";
import PaginationUI from "../components/PaginationUI";
import { getStatusTag } from "../utils/status";
import { ITEMS_PER_PAGE } from "../constants";
import { parseDate, dateToYYYYMM } from "../utils/date";
import { useMediaQuery } from "../hooks/useMediaQuery";

function ChartLabelWithStroke(props) {
  const { viewBox, position = "top", offset = 5, value, fill, fontSize = 10, fontWeight = "bold", formatter } = props;
  const text = value != null && value !== "" && (formatter ? formatter(value) : `${value} TB`);
  if (value === 0 || text === "" || text == null) return null;
  if (!viewBox || typeof viewBox.x !== "number") return null;
  const w = viewBox.upperWidth ?? viewBox.width ?? 0;
  const h = viewBox.height ?? 0;
  const centerX = viewBox.x + w / 2;
  const verticalOffset = typeof offset === "number" ? offset : 8;
  const labelY = position === "top" ? viewBox.y - verticalOffset : position === "bottom" ? viewBox.y + h + verticalOffset : viewBox.y + h / 2;
  const dominantBaseline = position === "top" ? "text-after-edge" : position === "bottom" ? "text-before-edge" : "middle";
  return (
    <text
      x={centerX}
      y={labelY}
      textAnchor="middle"
      dominantBaseline={dominantBaseline}
      fill={fill}
      stroke="white"
      strokeWidth={2}
      fontSize={fontSize}
      fontWeight={fontWeight}
      style={{ paintOrder: "stroke fill" }}
    >
      {text}
    </text>
  );
}

export default function Dashboard() {
  const {
    activeSession,
    currentSessionData,
    selectedArea,
    setSelectedArea,
    searchTerm,
    setSearchTerm,
    detailPage,
    setDetailPage,
  } = useApp();
  const [chartMonthFilter, setChartMonthFilter] = useState(0);
  const [chartPTMMonthFilter, setChartPTMMonthFilter] = useState(0);
  const [filterDateSigning, setFilterDateSigning] = useState("");
  const [filterDateUpdate, setFilterDateUpdate] = useState("");
  const [filterDatePrevExpiry, setFilterDatePrevExpiry] = useState("");
  const [filterDateExpiry, setFilterDateExpiry] = useState("");
  const isNarrowChart = useMediaQuery("(max-width: 767px)");

  const filteredDetailDataLocal = useMemo(() => {
    const base = selectedArea
      ? currentSessionData.filter((item) => item._area === selectedArea)
      : currentSessionData;
    return base.filter((row) => {
      const matchSearch =
        !searchTerm ||
        String(row._customer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row._id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row._taxId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row._address).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row._phone).toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (filterDateSigning && dateToYYYYMM(row._signingDate) !== filterDateSigning) return false;
      if (filterDateUpdate && dateToYYYYMM(row._updateDate) !== filterDateUpdate) return false;
      if (filterDatePrevExpiry && dateToYYYYMM(row._prevExpiryDate) !== filterDatePrevExpiry) return false;
      if (filterDateExpiry && dateToYYYYMM(row._expiryDate) !== filterDateExpiry) return false;
      return true;
    });
  }, [currentSessionData, selectedArea, searchTerm, filterDateSigning, filterDateUpdate, filterDatePrevExpiry, filterDateExpiry]);

  const areaStatsLocal = useMemo(() => {
    const stats = {};
    currentSessionData.forEach((item) => {
      const a = item._area;
      if (!stats[a])
        stats[a] = {
          name: a,
          expiring2026: 0,
          ptm: 0,
          giaHan2026: 0,
          giaHanDungHan2026: 0,
          giaHanSom2026: 0,
          giaHanTre2025: 0,
          total: 0,
          active: 0,
        };
      stats[a].total++;
      if (item._isExpiring2026) stats[a].expiring2026++;
      if (item._isPTM) stats[a].ptm++;
      if (item._isGiaHan2026) stats[a].giaHan2026++;
      if (item._isGiaHanDungHan2026) stats[a].giaHanDungHan2026++;
      if (item._isGiaHanSom2026) stats[a].giaHanSom2026++;
      if (item._isGiaHanTre2025) stats[a].giaHanTre2025++;
      if (item._isActive) stats[a].active++;
    });
    return Object.values(stats)
      .map((s) => ({
        ...s,
        conPhaiGiaHan2026: s.expiring2026,
      }))
      .sort((a, b) => b.active - a.active);
  }, [currentSessionData]);

  const totalsLocal = useMemo(() => {
    const source = selectedArea
      ? currentSessionData.filter((i) => i._area === selectedArea)
      : currentSessionData;
    const reduced = source.reduce(
      (acc, cur) => ({
        expiring2026: acc.expiring2026 + (cur._isExpiring2026 ? 1 : 0),
        ptm: acc.ptm + (cur._isPTM ? 1 : 0),
        giaHan2026: acc.giaHan2026 + (cur._isGiaHan2026 ? 1 : 0),
        giaHanDungHan2026:
          acc.giaHanDungHan2026 + (cur._isGiaHanDungHan2026 ? 1 : 0),
        giaHanSom2026: acc.giaHanSom2026 + (cur._isGiaHanSom2026 ? 1 : 0),
        giaHanTre2025: acc.giaHanTre2025 + (cur._isGiaHanTre2025 ? 1 : 0),
        total: acc.total + 1,
        active: acc.active + (cur._isActive ? 1 : 0),
      }),
      {
        expiring2026: 0,
        ptm: 0,
        giaHan2026: 0,
        giaHanDungHan2026: 0,
        giaHanSom2026: 0,
        giaHanTre2025: 0,
        total: 0,
        active: 0,
      }
    );
    return {
      ...reduced,
      conPhaiGiaHan2026: reduced.expiring2026,
    };
  }, [currentSessionData, selectedArea]);

  const paginatedSubscribersLocal = useMemo(() => {
    const start = (detailPage - 1) * ITEMS_PER_PAGE;
    return filteredDetailDataLocal.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDetailDataLocal, detailPage]);

  const giaHan2026ByAreaMonth = useMemo(() => {
    const byAreaMonthGiaHanSom2026 = {};
    const byAreaMonthGiaHanDungHan2026 = {};
    const byAreaMonthGiaHanTre2025 = {};
    const areasSet = new Set();
    currentSessionData.forEach((item) => {
      const area = item._area || "Chưa phân loại";
      const ts = item._updateTs || parseDate(item._updateDate);
      if (!ts) return;
      const d = new Date(ts);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      if (year !== 2026) return;
      if (item._isGiaHanSom2026) {
        areasSet.add(area);
        if (!byAreaMonthGiaHanSom2026[area]) byAreaMonthGiaHanSom2026[area] = {};
        byAreaMonthGiaHanSom2026[area][month] = (byAreaMonthGiaHanSom2026[area][month] ?? 0) + 1;
      }
      if (item._isGiaHanDungHan2026) {
        areasSet.add(area);
        if (!byAreaMonthGiaHanDungHan2026[area]) byAreaMonthGiaHanDungHan2026[area] = {};
        byAreaMonthGiaHanDungHan2026[area][month] = (byAreaMonthGiaHanDungHan2026[area][month] ?? 0) + 1;
      }
      if (item._isGiaHanTre2025) {
        areasSet.add(area);
        if (!byAreaMonthGiaHanTre2025[area]) byAreaMonthGiaHanTre2025[area] = {};
        byAreaMonthGiaHanTre2025[area][month] = (byAreaMonthGiaHanTre2025[area][month] ?? 0) + 1;
      }
    });
    return {
      byAreaMonthGiaHanSom2026,
      byAreaMonthGiaHanDungHan2026,
      byAreaMonthGiaHanTre2025,
      areas: Array.from(areasSet).sort(),
    };
  }, [currentSessionData]);

  // Số thuê bao hết hạn 2026 theo khu vực/tháng: dùng cùng logic _isExpiring2026 như thẻ & bảng để tổng biểu đồ khớp với totalsLocal.expiring2026
  const hetHanByAreaMonth = useMemo(() => {
    const byAreaMonth = {};
    currentSessionData.forEach((item) => {
      if (!item._isExpiring2026) return;
      const expiryTs = item._expiryTs || parseDate(item._expiryDate);
      if (!expiryTs) return;
      const d = new Date(expiryTs);
      const month = d.getMonth() + 1;
      const area = item._area || "Chưa phân loại";
      if (!byAreaMonth[area]) byAreaMonth[area] = {};
      byAreaMonth[area][month] = (byAreaMonth[area][month] ?? 0) + 1;
    });
    return byAreaMonth;
  }, [currentSessionData]);

  const allAreasForChart = useMemo(
    () => areaStatsLocal.map((s) => s.name).sort(),
    [areaStatsLocal]
  );

  const giaHan2026ChartData = useMemo(() => {
    const { byAreaMonthGiaHanSom2026, byAreaMonthGiaHanDungHan2026, byAreaMonthGiaHanTre2025 } = giaHan2026ByAreaMonth;
    if (allAreasForChart.length === 0) return [];
    const sumOrMonth = (byAreaMonth, area) =>
      chartMonthFilter === 0
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
            (s, m) => s + (byAreaMonth[area]?.[m] ?? 0),
            0
          )
        : (byAreaMonth[area]?.[chartMonthFilter] ?? 0);
    const hetHanForArea = (area) =>
      chartMonthFilter === 0
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
            (s, m) => s + (hetHanByAreaMonth[area]?.[m] ?? 0),
            0
          )
        : (hetHanByAreaMonth[area]?.[chartMonthFilter] ?? 0);
    return allAreasForChart.map((area) => ({
      khuVuc: area,
      giaHanSom2026: sumOrMonth(byAreaMonthGiaHanSom2026, area),
      giaHanDungHan2026: sumOrMonth(byAreaMonthGiaHanDungHan2026, area),
      giaHanTre2025: sumOrMonth(byAreaMonthGiaHanTre2025, area),
      hetHan: hetHanForArea(area),
    }));
  }, [giaHan2026ByAreaMonth, hetHanByAreaMonth, chartMonthFilter, allAreasForChart]);

  const giaHan2026ChartAreas = allAreasForChart;

  const totalsGiaHanChart = useMemo(() => {
    const totalHetHan2026 = giaHan2026ChartData.reduce((s, row) => s + (row.hetHan || 0), 0);
    const totalGiaHanDungHan2026 = giaHan2026ChartData.reduce((s, row) => s + (row.giaHanDungHan2026 || 0), 0);
    const totalGiaHanSom2026 = giaHan2026ChartData.reduce((s, row) => s + (row.giaHanSom2026 || 0), 0);
    const totalGiaHanTre2025 = giaHan2026ChartData.reduce((s, row) => s + (row.giaHanTre2025 || 0), 0);
    const totalChuaGiaHan = totalHetHan2026;
    const tyLeHoanThanh = totalHetHan2026 > 0 ? ((totalGiaHanDungHan2026 + totalGiaHanSom2026) / totalHetHan2026) * 100 : 0;
    return { totalHetHan2026, totalGiaHanDungHan2026, totalGiaHanSom2026, totalGiaHanTre2025, totalChuaGiaHan, tyLeHoanThanh };
  }, [giaHan2026ChartData]);

  const ptmByAreaMonth = useMemo(() => {
    const byAreaMonth = {};
    const areasSet = new Set();
    currentSessionData.forEach((item) => {
      if (!item._isPTM) return;
      const ts = item._signingTs || parseDate(item._signingDate);
      if (!ts) return;
      const d = new Date(ts);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      if (year !== 2026) return;
      const area = item._area || "Chưa phân loại";
      areasSet.add(area);
      if (!byAreaMonth[area]) byAreaMonth[area] = {};
      byAreaMonth[area][month] = (byAreaMonth[area][month] ?? 0) + 1;
    });
    return { byAreaMonth, areas: Array.from(areasSet).sort() };
  }, [currentSessionData]);

  const ptmChartData = useMemo(() => {
    const { byAreaMonth, areas } = ptmByAreaMonth;
    if (areas.length === 0) return [];
    const sumOrMonth = (area) =>
      chartPTMMonthFilter === 0
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
            (s, m) => s + (byAreaMonth[area]?.[m] ?? 0),
            0
          )
        : (byAreaMonth[area]?.[chartPTMMonthFilter] ?? 0);
    return areas.map((area) => ({
      khuVuc: area,
      ptm: sumOrMonth(area),
    }));
  }, [ptmByAreaMonth, chartPTMMonthFilter]);

  const ptmChartAreas = ptmByAreaMonth.areas;

  if (!activeSession) return null;

  const totalGiaHan2026 = totalsLocal.giaHanDungHan2026 + totalsLocal.giaHanSom2026 + totalsLocal.giaHanTre2025;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 text-[12px] w-full max-w-full overflow-x-hidden">
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-center w-full">
        {[
          {
            label: "Đang hoạt động",
            val: totalsLocal.active,
            color: "emerald",
            icon: Activity,
          },
          {
            label: "Hết hạn 2026",
            val: totalsLocal.expiring2026,
            color: "rose",
            icon: AlertCircle,
          },
          {
            label: "Số TB còn phải gia hạn 2026",
            val: totalsLocal.conPhaiGiaHan2026,
            color: "orange",
            icon: Clock,
          },
          {
            label: "Gia hạn 2026",
            val: totalGiaHan2026,
            color: "emerald",
            icon: RefreshCw,
          },
          {
            label: "PTM 2026",
            val: totalsLocal.ptm,
            color: "cyan",
            icon: TrendingUp,
          },
        ].map((stat, i) =>
          stat.label === "Gia hạn 2026" ? (
            <div
              key={i}
              className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 min-h-[88px] sm:min-h-[96px] flex flex-col justify-between text-center"
            >
              <div className="flex justify-between items-start">
                <p className="text-[8px] font-black text-emerald-600 uppercase leading-tight">
                  {stat.label}
                </p>
                <stat.icon size={12} className="text-emerald-200 shrink-0" />
              </div>
              <div className="flex items-center justify-center gap-3 mt-1 flex-1 min-h-0">
                <div className="flex items-center justify-center shrink-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                    {totalGiaHan2026.toLocaleString()}
                  </h2>
                </div>
                <div className="flex-1 min-w-0 text-left text-[9px] text-slate-500 space-y-0.5 font-medium">
                  <span className="block">GH đúng hạn: <span className="font-black text-slate-700 text-[9px]">{totalsLocal.giaHanDungHan2026.toLocaleString()}</span></span>
                  <span className="block">GH sớm: <span className="font-black text-slate-700 text-[9px]">{totalsLocal.giaHanSom2026.toLocaleString()}</span></span>
                  <span className="block">GH cho tb hết hạn 2025: <span className="font-black text-slate-700 text-[9px]">{totalsLocal.giaHanTre2025.toLocaleString()}</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={i}
              className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-${stat.color}-500 min-h-[88px] sm:min-h-[96px] flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start">
                <p className={`text-[8px] font-black text-${stat.color}-600 uppercase leading-tight`}>
                  {stat.label}
                </p>
                <stat.icon size={12} className={`text-${stat.color}-200 shrink-0`} />
              </div>
              <div className="flex flex-1 items-center justify-center mt-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                  {stat.val.toLocaleString()}
                </h2>
              </div>
            </div>
          )
        )}
      </div>

      {!selectedArea ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden font-bold overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px] min-w-[640px]">
            <thead className="bg-slate-50 text-slate-400 text-[12px] uppercase font-black border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 ">Khu vực phân bổ</th>
                <th className="px-4 py-2 text-center">Hoạt động</th>
                <th className="px-4 py-2 text-center">Hết hạn 2026</th>
                <th className="px-4 py-2 text-center">Còn phải gia hạn 2026</th>
                <th className="px-4 py-2 text-center">Gia hạn 2026</th>
                <th className="px-4 py-2 text-center">Gia hạn trễ 2025</th>
                <th className="px-4 py-2 text-center">PTM 2026</th>
                <th className="px-4 py-2 text-center w-40 hidden">Tỷ lệ gia hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {areaStatsLocal.map((s, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    setSelectedArea(s.name);
                    setDetailPage(1);
                  }}
                  className="hover:bg-indigo-50/50 cursor-pointer"
                >
                  <td className="px-4 py-2 text-slate-800 uppercase group-hover:text-indigo-600 flex items-center gap-2 text-center">
                    <ChevronRight size={10} className="text-slate-300" />{" "}
                    {s.name}
                  </td>
                  <td className="px-4 py-2 text-center text-emerald-600">
                    {s.active.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-rose-600">
                    {s.expiring2026.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-orange-600 font-bold">
                    {s.conPhaiGiaHan2026.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-emerald-600 font-bold">
                    {(s.giaHanDungHan2026 + s.giaHanSom2026).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-amber-600 font-bold">
                    {s.giaHanTre2025.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-cyan-600 font-bold">
                    {s.ptm.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center hidden">
                    {(() => {
                      const daGiaHan = s.giaHanDungHan2026 + s.giaHanSom2026;
                      const denHan = s.expiring2026;
                      const pct = denHan > 0 ? (daGiaHan / denHan) * 100 : 0;
                      return (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-indigo-700 font-black text-[11px]">
                            {denHan === 0 ? "—" : `${pct.toFixed(1)}%`}
                          </span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner min-w-[60px]">
                            <div
                              className="bg-indigo-500 h-full transition-all duration-1000"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setSelectedArea(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md font-black text-[9px] hover:bg-indigo-600 uppercase transition-all shadow-md active:scale-95"
            >
              <ArrowLeft size={14} /> Quay lại danh sách
            </button>
            {/* <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tìm trong bảng: MST, mã HĐ, khách hàng, địa chỉ, SĐT..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDetailPage(1);
                }}
              />
            </div> */}
            <div className="flex gap-2 font-black uppercase text-[9px]">
              <span className="text-slate-400 tracking-tighter">
                Vùng quản lý:
              </span>
              <span className="text-indigo-700 tracking-tighter">
                {selectedArea}
              </span>
              <span className="text-slate-300 mx-1">|</span>
              <span className="text-slate-600 italic tracking-tighter">
                {filteredDetailDataLocal.length.toLocaleString()} bản ghi
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden font-bold text-[10px] flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1750px]">
                <thead className="bg-slate-900 text-white text-[8px] uppercase tracking-widest sticky top-0 z-10 border-b border-white/10 shadow-lg">
                  <tr>
                    <th className="px-2 py-3 w-10 text-center">STT</th>
                    <th className="px-2 py-3 w-16 text-center">Mã HĐ</th>
                    <th className="px-2 py-3 w-24 text-center text-slate-300">Mã TB DHSX</th>
                    <th className="px-2 py-3 w-28 text-amber-300 font-black text-center">
                      MST
                    </th>
                    <th className="px-2 py-3 w-32 text-center text-indigo-300">
                      SĐT
                    </th>
                    <th className="px-3 py-3 w-[250px] text-center">
                      Khách Hàng
                    </th>
                    <th className="px-3 py-3 w-[300px] text-center">
                      Địa Chỉ Hệ Thống
                    </th>
                    <th className="px-2 py-3 text-center w-24">Ngày Ký</th>
                    <th className="px-2 py-3 text-center w-24">
                      Ngày Cập Nhật
                    </th>
                    <th className="px-2 py-3 text-center w-28 text-rose-300 italic">
                      Hết Hạn Cũ
                    </th>
                    <th className="px-2 py-3 text-center w-28 text-emerald-300 font-black">
                      Hết Hạn Mới
                    </th>
                    <th className="px-2 py-3 text-center w-24">
                      Trạng Thái
                    </th>
                  </tr>
                  <tr className="bg-slate-800/80">
                    <th className="px-1 py-1 w-10" />
                    <th className="px-1 py-1 w-16" />
                    <th className="px-1 py-1 w-24" />
                    <th className="px-1 py-1 w-28" />
                    <th className="px-1 py-1 w-32" />
                    <th className="px-1 py-1 w-[250px]" />
                    <th className="px-1 py-1 w-[300px]" />
                    <th className="px-1 py-1 w-24 text-center">
                      <input
                        type="month"
                        className="w-full max-w-[100px] px-1 py-0.5 text-[9px] font-bold text-slate-800 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-400"
                        value={filterDateSigning}
                        onChange={(e) => { setFilterDateSigning(e.target.value); setDetailPage(1); }}
                        title="Lọc theo tháng/năm Ngày Ký"
                      />
                    </th>
                    <th className="px-1 py-1 w-24 text-center">
                      <input
                        type="month"
                        className="w-full max-w-[100px] px-1 py-0.5 text-[9px] font-bold text-slate-800 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-400"
                        value={filterDateUpdate}
                        onChange={(e) => { setFilterDateUpdate(e.target.value); setDetailPage(1); }}
                        title="Lọc theo tháng/năm Ngày Cập Nhật"
                      />
                    </th>
                    <th className="px-1 py-1 w-28 text-center">
                      <input
                        type="month"
                        className="w-full max-w-[100px] px-1 py-0.5 text-[9px] font-bold text-slate-800 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-400"
                        value={filterDatePrevExpiry}
                        onChange={(e) => { setFilterDatePrevExpiry(e.target.value); setDetailPage(1); }}
                        title="Lọc theo tháng/năm Hết Hạn Cũ"
                      />
                    </th>
                    <th className="px-1 py-1 w-28 text-center">
                      <input
                        type="month"
                        className="w-full max-w-[100px] px-1 py-0.5 text-[9px] font-bold text-slate-800 bg-white border border-slate-300 rounded outline-none focus:ring-1 focus:ring-indigo-400"
                        value={filterDateExpiry}
                        onChange={(e) => { setFilterDateExpiry(e.target.value); setDetailPage(1); }}
                        title="Lọc theo tháng/năm Hết Hạn Mới"
                      />
                    </th>
                    <th className="px-1 py-1 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {paginatedSubscribersLocal.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-1.5 text-center text-slate-400 font-normal">
                        {(detailPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500 italic text-center">
                        {row._id}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500 text-center font-medium">
                        {row._subIdDhs}
                      </td>
                      <td className="px-2 py-1.5 text-amber-700 font-black tracking-tighter text-center">
                        {row._taxId}
                      </td>
                      <td className="px-2 py-1.5 text-indigo-500 font-black tracking-widest text-center">
                        {row._phone}
                      </td>
                      <td className="px-3 py-2 text-slate-800 font-semibold uppercase truncate">
                        <CustomTooltip content={row._customer} maxWidth="max-w-[360px]">
                          <span className="truncate block max-w-[220px] font-bold">
                            {row._customer}
                          </span>
                        </CustomTooltip>
                      </td>
                      <td className="px-3 py-2 text-slate-400 italic leading-snug font-normal truncate">
                        <CustomTooltip content={row._address} maxWidth="max-w-[420px]">
                          <span className="truncate block max-w-[280px]">
                            {row._address}
                          </span>
                        </CustomTooltip>
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold text-slate-500 whitespace-nowrap">
                        {row._signingDate}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold text-slate-400 whitespace-nowrap">
                        {row._updateDate}
                      </td>
                      <td className="px-2 py-1.5 text-center font-bold text-rose-500/80 bg-rose-50/20">
                        {row._prevExpiryDate}
                      </td>
                      <td className="px-2 py-1.5 text-center font-black text-indigo-800 italic bg-indigo-50/40">
                        {row._expiryDate}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border shadow-sm ${getStatusTag(
                            row._status,
                            row._isActive
                          )}`}
                        >
                          {row._status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationUI
              current={detailPage}
              totalItems={filteredDetailDataLocal.length}
              onPageChange={setDetailPage}
            />
          </div>
        </div>
      )}

      {!selectedArea && giaHan2026ChartAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-tighter">
              Thống kê gia hạn trong năm 2026 theo khu vực
            </h3>
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
              Tháng (2026):
              <select
                value={chartMonthFilter}
                onChange={(e) => setChartMonthFilter(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[11px] font-bold text-slate-800"
              >
                <option value={0}>Tất cả</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="h-[400px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={giaHan2026ChartData}
                margin={isNarrowChart ? { top: 40, right: 16, left: 8, bottom: 170 } : { top: 40, right: 12, left: 0, bottom: 120 }}
                barGap={isNarrowChart ? 6 : 12}
                barCategoryGap={isNarrowChart ? "12%" : undefined}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="khuVuc"
                  tick={{ fontSize: isNarrowChart ? 8 : 9, fill: "#64748b" }}
                  tickFormatter={(v) => {
                    const s = (v && String(v).replace(/^VNPT\s+KHU\s+VỰC\s+/i, "").trim()) || "";
                    return isNarrowChart && s.length > 12 ? `${s.slice(0, 11)}…` : s;
                  }}
                  tickLine={false}
                  interval={0}
                  angle={isNarrowChart ? -45 : 0}
                  textAnchor={isNarrowChart ? "end" : "middle"}
                  height={isNarrowChart ? 110 : undefined}
                />
                <YAxis
                  tick={{ fontSize: isNarrowChart ? 9 : 10, fill: "#64748b" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={isNarrowChart ? 28 : undefined}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                  labelFormatter={(label) => `Khu vực: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: isNarrowChart ? 9 : 10 }} verticalAlign={isNarrowChart ? "bottom" : "top"} align="center" />
                <Bar
                  dataKey="giaHanTre2025"
                  name="Gia hạn trễ (TB hết hạn 2025)"
                  fill="#d97706"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={isNarrowChart ? 24 : 48}
                >
                  <LabelList dataKey="giaHanTre2025" position="top" content={(p) => <ChartLabelWithStroke {...p} fill="#b45309" fontSize={isNarrowChart ? 8 : 10} formatter={(v) => (v === 0 ? "" : (isNarrowChart ? `${v}` : `${v} TB`))} />} />
                </Bar>
                <Bar
                  dataKey="giaHanDungHan2026"
                  name="Gia hạn đúng hạn (TB hết hạn 2026)"
                  fill="#059669"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={isNarrowChart ? 24 : 48}
                >
                  <LabelList dataKey="giaHanDungHan2026" position="top" content={(p) => <ChartLabelWithStroke {...p} fill="#047857" fontSize={isNarrowChart ? 8 : 10} formatter={(v) => (v === 0 ? "" : (isNarrowChart ? `${v}` : `${v} TB`))} />} />
                </Bar>
                <Bar
                  dataKey="giaHanSom2026"
                  name="Gia hạn sớm (TB hết hạn 2026)"
                  fill="#0ea5e9"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={isNarrowChart ? 24 : 48}
                >
                  <LabelList dataKey="giaHanSom2026" position="top" content={(p) => <ChartLabelWithStroke {...p} fill="#0284c7" fontSize={isNarrowChart ? 8 : 10} formatter={(v) => (v === 0 ? "" : (isNarrowChart ? `${v}` : `${v} TB`))} />} />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-[11px] font-bold justify-center items-center">
            <span className="text-slate-600">
              Tổng TB hết hạn 2026 (gốc):{" "}
              <strong className="text-slate-800">{totalsGiaHanChart.totalHetHan2026.toLocaleString()}</strong> TB
            </span>
            <span className="text-rose-600">
              Còn phải gia hạn:{" "}
              <strong className="text-rose-700">{totalsGiaHanChart.totalChuaGiaHan.toLocaleString()}</strong> TB
            </span>
            <span className="text-indigo-600">
              Tỷ lệ hoàn thành gia hạn:{" "}
              <strong className="text-indigo-700">{totalsGiaHanChart.tyLeHoanThanh.toFixed(1)}%</strong>
            </span>
            <span className="text-emerald-600">
              Đúng hạn: <strong className="text-emerald-700">{totalsGiaHanChart.totalGiaHanDungHan2026.toLocaleString()}</strong>
            </span>
            <span className="text-sky-600">
              Sớm: <strong className="text-sky-700">{totalsGiaHanChart.totalGiaHanSom2026.toLocaleString()}</strong>
            </span>
            <span className="text-amber-600">
              Trễ 2025: <strong className="text-amber-700">{totalsGiaHanChart.totalGiaHanTre2025.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}

      {!selectedArea && giaHan2026ChartAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-tighter">
              Số thuê bao hết hạn năm 2026 nhưng chưa được gia hạn
            </h3>
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
              Tháng (2026):
              <select
                value={chartMonthFilter}
                onChange={(e) => setChartMonthFilter(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[11px] font-bold text-slate-800"
              >
                <option value={0}>Tất cả</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="h-[400px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={giaHan2026ChartData}
                margin={isNarrowChart ? { top: 40, right: 28, left: 8, bottom: 170 } : { top: 40, right: 28, left: 0, bottom: 140 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="khuVuc"
                  tick={{ fontSize: isNarrowChart ? 8 : 9, fill: "#64748b" }}
                  tickFormatter={(v) => {
                    const s = (v && String(v).replace(/^VNPT\s+KHU\s+VỰC\s+/i, "").trim()) || "";
                    return isNarrowChart && s.length > 12 ? `${s.slice(0, 11)}…` : s;
                  }}
                  tickLine={false}
                  interval={0}
                  angle={isNarrowChart ? -45 : 0}
                  textAnchor={isNarrowChart ? "end" : "middle"}
                  height={isNarrowChart ? 110 : undefined}
                />
                <YAxis
                  tick={{ fontSize: isNarrowChart ? 9 : 10, fill: "#64748b" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={isNarrowChart ? 28 : undefined}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }}
                  labelFormatter={(label) => `Khu vực: ${label}`}
                  formatter={(value) => [value, "Số TB hết hạn"]}
                />
                <Line
                  type="monotone"
                  dataKey="hetHan"
                  name="Số thuê bao hết hạn 2026"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={{ fill: "#dc2626", r: 4 }}
                  connectNulls
                >
                  <LabelList dataKey="hetHan" position="top" offset={8} content={(p) => <ChartLabelWithStroke {...p} fill="#dc2626" fontSize={isNarrowChart ? 8 : 9} formatter={(v) => (v === 0 ? "" : `${v} TB`)} />} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!selectedArea && ptmChartAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-tighter">
              Thống kê thuê bao phát triển mới theo khu vực
            </h3>
            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
              Tháng ký:
              <select
                value={chartPTMMonthFilter}
                onChange={(e) => setChartPTMMonthFilter(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-[11px] font-bold text-slate-800"
              >
                <option value={0}>Tất cả</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="h-[380px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ptmChartData}
                margin={isNarrowChart ? { top: 40, right: 16, left: 8, bottom: 170 } : { top: 40, right: 12, left: 0, bottom: 140 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="khuVuc"
                  tick={{ fontSize: isNarrowChart ? 8 : 9, fill: "#64748b" }}
                  tickFormatter={(v) => {
                    const s = (v && String(v).replace(/^VNPT\s+KHU\s+VỰC\s+/i, "").trim()) || "";
                    return isNarrowChart && s.length > 12 ? `${s.slice(0, 11)}…` : s;
                  }}
                  tickLine={false}
                  interval={0}
                  angle={isNarrowChart ? -45 : 0}
                  textAnchor={isNarrowChart ? "end" : "middle"}
                  height={isNarrowChart ? 110 : undefined}
                />
                <YAxis
                  tick={{ fontSize: isNarrowChart ? 9 : 10, fill: "#64748b" }}
                  tickLine={false}
                  allowDecimals={false}
                  width={isNarrowChart ? 28 : undefined}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                  formatter={(value) => [value, "Số TB PTM"]}
                  labelFormatter={(label) => `Khu vực: ${label}`}
                />
                <Bar
                  dataKey="ptm"
                  name="Thuê bao phát triển mới"
                  fill="#0284c7"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={56}
                  isAnimationActive={false}
                  activeBar={false}
                >
                  <LabelList dataKey="ptm" position="top" zIndex={10} content={(p) => <ChartLabelWithStroke {...p} fill="#0369a1" fontSize={isNarrowChart ? 8 : 10} formatter={(v) => (v === 0 ? "" : `${v} TB`)} />} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
