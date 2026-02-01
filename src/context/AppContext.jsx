import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { loadXLSX, exportToExcel } from "../utils/excel";
import { processTransactions, processTransactionsHomeClinic } from "../utils/transactions";
import { getColumnValue } from "../utils/normalize";
import {
  fetchGoogleSheetCSVText,
  fetchPharmacySheetCSVText,
  DEFAULT_DM_SHEET_ID,
} from "../utils/googleSheet";
import { ITEMS_PER_PAGE } from "../constants";

const AppContext = createContext(null);

const SERVICE_PHARMACY = "pharmacy";
const SERVICE_HOMECLINIC = "homeClinic";

export function AppProvider({ children }) {
  const [reportSessionsPharmacy, setReportSessionsPharmacy] = useState([]);
  const [reportSessionsHomeClinic, setReportSessionsHomeClinic] = useState([]);
  const [activePharmacySessionId, setActivePharmacySessionId] = useState(null);
  const [activeHomeClinicSessionId, setActiveHomeClinicSessionId] = useState(null);
  const [calendarServiceType, setCalendarServiceType] = useState(SERVICE_PHARMACY);
  const [communeList, setCommuneList] = useState([]);
  const [pendingData, setPendingData] = useState(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [pendingForView, setPendingForView] = useState(SERVICE_PHARMACY);
  const [view, setView] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPharmacySheetSite, setLoadingPharmacySheetSite] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [importSite, setImportSite] = useState("");
  const [communePage, setCommunePage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calArea, setCalArea] = useState("Tất cả");
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState(null);
  const initialPharmacySessionsLoaded = useRef(false);

  useEffect(() => {
    loadXLSX();
  }, []);

  // Khởi tạo tự động: nạp Danh mục → parse bằng XLSX → nạp LAN + TNH song song → parse bằng XLSX → tạo 2 phiên báo cáo, ưu tiên LAN
  const initAppCloudData = React.useCallback(async () => {
    if (initialPharmacySessionsLoaded.current) return;
    setIsProcessing(true);
    const XLSX = await loadXLSX();
    try {
      const catText = await fetchGoogleSheetCSVText(DEFAULT_DM_SHEET_ID);
      const catWb = XLSX.read(catText, { type: "string" });
      const catData = XLSX.utils.sheet_to_json(
        catWb.Sheets[catWb.SheetNames[0]]
      );
      if (catData && catData.length > 0) setCommuneList(catData);

      const [lanText, tnhText] = await Promise.all([
        fetchPharmacySheetCSVText("LAN"),
        fetchPharmacySheetCSVText("TNH"),
      ]);

      const lanWb = XLSX.read(lanText, { type: "string" });
      const tnhWb = XLSX.read(tnhText, { type: "string" });
      const lanRaw = XLSX.utils.sheet_to_json(
        lanWb.Sheets[lanWb.SheetNames[0]]
      );
      const tnhRaw = XLSX.utils.sheet_to_json(
        tnhWb.Sheets[tnhWb.SheetNames[0]]
      );

      const lanProcessed = processTransactions(lanRaw, catData, "LAN");
      const tnhProcessed = processTransactions(tnhRaw, catData, "TNH");

      const nowStr = new Date().toLocaleTimeString();
      const baseId = Date.now();
      const lanSession = {
        id: baseId,
        fileName: "Auto-Load LAN Cloud",
        site: "LAN",
        timestamp: nowStr,
        data: lanProcessed,
      };
      const tnhSession = {
        id: baseId + 1,
        fileName: "Auto-Load TNH Cloud",
        site: "TNH",
        timestamp: nowStr,
        data: tnhProcessed,
      };

      initialPharmacySessionsLoaded.current = true;
      setReportSessionsPharmacy([lanSession, tnhSession]);
      setActivePharmacySessionId(lanSession.id);
      setView("dashboard");
    } catch (err) {
      console.error("Lỗi Auto-Load Cloud:", err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    initAppCloudData();
  }, [initAppCloudData]);

  const activeSession = useMemo(() => {
    if (view === "dashboard") {
      return reportSessionsPharmacy.find((s) => s.id === activePharmacySessionId) || null;
    }
    if (view === "homeClinic") {
      return reportSessionsHomeClinic.find((s) => s.id === activeHomeClinicSessionId) || null;
    }
    if (view === "calendar") {
      const list = calendarServiceType === SERVICE_HOMECLINIC ? reportSessionsHomeClinic : reportSessionsPharmacy;
      const id = calendarServiceType === SERVICE_HOMECLINIC ? activeHomeClinicSessionId : activePharmacySessionId;
      return list.find((s) => s.id === id) || null;
    }
    return null;
  }, [view, calendarServiceType, reportSessionsPharmacy, reportSessionsHomeClinic, activePharmacySessionId, activeHomeClinicSessionId]);

  const currentSessionData = useMemo(() => {
    return activeSession ? activeSession.data : [];
  }, [activeSession]);

  const allAreasInSession = useMemo(() => {
    if (!activeSession) return [];
    const areas = new Set();
    activeSession.data.forEach((item) => {
      if (item._area) areas.add(item._area);
    });
    return Array.from(areas).sort();
  }, [activeSession]);

  const availableSites = useMemo(() => {
    const sites = new Set();
    communeList.forEach((c) => {
      const s = getColumnValue(c, ["Mã tỉnh", "Ma tinh", "Site", "Tinh"]);
      if (s) sites.add(String(s).trim());
    });
    return Array.from(sites).sort();
  }, [communeList]);

  const handleFileUpload = async (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;
    const XLSX = await loadXLSX();
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]]
        );
        if (mode === "category") {
          setCommuneList(data);
          setCommunePage(1);
        } else {
          setPendingData(data);
          setPendingFileName(file.name);
          setPendingForView(view === "homeClinic" ? SERVICE_HOMECLINIC : SERVICE_PHARMACY);
        }
      } catch (err) {
        console.error("Lỗi file:", err);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleAnalyze = () => {
    if (pendingForView !== SERVICE_HOMECLINIC && !importSite) {
      alert("Vui lòng chọn Mã tỉnh (Site)!");
      return;
    }
    if (!pendingData) return;
    setIsProcessing(true);
    setTimeout(() => {
      const processedData =
        pendingForView === SERVICE_HOMECLINIC
          ? processTransactionsHomeClinic(pendingData, communeList, "")
          : processTransactions(pendingData, communeList, importSite);
      const newSession = {
        id: Date.now(),
        fileName: pendingFileName,
        site:
          pendingForView === SERVICE_HOMECLINIC ? "Nhiều site" : importSite,
        timestamp: new Date().toLocaleTimeString(),
        data: processedData,
      };
      if (pendingForView === SERVICE_HOMECLINIC) {
        setReportSessionsHomeClinic((prev) => [newSession, ...prev]);
        setActiveHomeClinicSessionId(newSession.id);
        setView("homeClinic");
      } else {
        setReportSessionsPharmacy((prev) => [newSession, ...prev]);
        setActivePharmacySessionId(newSession.id);
        setView("dashboard");
      }
      setPendingData(null);
      setPendingFileName("");
      setIsProcessing(false);
      setSelectedArea(null);
    }, 400);
  };

  const removeSession = (sessionId, serviceType) => {
    if (serviceType === SERVICE_HOMECLINIC) {
      setReportSessionsHomeClinic((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeHomeClinicSessionId === sessionId) setActiveHomeClinicSessionId(null);
    } else {
      setReportSessionsPharmacy((prev) => prev.filter((s) => s.id !== sessionId));
      if (activePharmacySessionId === sessionId) setActivePharmacySessionId(null);
    }
  };

  const loadDefaultCategoriesFromSheet = async () => {
    try {
      const XLSX = await loadXLSX();
      const catText = await fetchGoogleSheetCSVText(DEFAULT_DM_SHEET_ID);
      const catWb = XLSX.read(catText, { type: "string" });
      const data = XLSX.utils.sheet_to_json(catWb.Sheets[catWb.SheetNames[0]]);
      if (data && data.length > 0) {
        setCommuneList(data);
        setCommunePage(1);
        return data.length;
      }
      return 0;
    } catch (err) {
      console.error("Lỗi tải Danh mục từ Sheet:", err);
      return 0;
    }
  };

  const loadPharmacyFromSheet = async (site) => {
    if (!communeList.length) {
      alert("Vui lòng nạp Danh mục (DM-Xa) trước. Vào Quản lý danh mục → Lấy từ Google Sheet hoặc Nạp file.");
      return;
    }
    setLoadingPharmacySheetSite(site);
    try {
      const XLSX = await loadXLSX();
      const csvText = await fetchPharmacySheetCSVText(site);
      const wb = XLSX.read(csvText, { type: "string" });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!data || !data.length) {
        alert("Sheet không có dữ liệu.");
        return;
      }
      const processedData = processTransactions(data, communeList, site);
      const newSession = {
        id: Date.now(),
        fileName: `Sync Manual (${site})`,
        site,
        timestamp: new Date().toLocaleTimeString(),
        data: processedData,
      };
      setReportSessionsPharmacy((prev) => [newSession, ...prev]);
      setActivePharmacySessionId(newSession.id);
      setView("dashboard");
      setSelectedArea(null);
    } catch (err) {
      alert(err?.message || "Không tải được dữ liệu từ Google Sheet.");
    } finally {
      setLoadingPharmacySheetSite("");
    }
  };

  const handleExportExcel = () => {
    if (!currentSessionData.length) {
      alert("Không có dữ liệu để xuất.");
      return;
    }
    const baseName = activeSession?.fileName
      ? String(activeSession.fileName).replace(/\.xlsx?$/i, "")
      : "xuat-du-lieu";
    exportToExcel(currentSessionData, `${baseName}_xuat`)
      .catch((err) => alert(err?.message || "Xuất Excel thất bại."));
  };

  const value = useMemo(
    () => ({
      reportSessionsPharmacy,
      reportSessionsHomeClinic,
      activePharmacySessionId,
      setActivePharmacySessionId,
      activeHomeClinicSessionId,
      setActiveHomeClinicSessionId,
      calendarServiceType,
      setCalendarServiceType,
      communeList,
      setCommuneList,
      pendingData,
      pendingFileName,
      pendingForView,
      view,
      setView,
      searchTerm,
      setSearchTerm,
      isProcessing,
      selectedArea,
      setSelectedArea,
      importSite,
      setImportSite,
      communePage,
      setCommunePage,
      detailPage,
      setDetailPage,
      calMonth,
      setCalMonth,
      calYear,
      setCalYear,
      calArea,
      setCalArea,
      selectedDayDetail,
      setSelectedDayDetail,
      selectedMonthDetail,
      setSelectedMonthDetail,
      activeSession,
      currentSessionData,
      allAreasInSession,
      availableSites,
      handleFileUpload,
      handleAnalyze,
      removeSession,
      handleExportExcel,
      loadDefaultCategoriesFromSheet,
      loadPharmacyFromSheet,
      loadingPharmacySheetSite,
    }),
    [
      reportSessionsPharmacy,
      reportSessionsHomeClinic,
      activePharmacySessionId,
      activeHomeClinicSessionId,
      calendarServiceType,
      communeList,
      pendingData,
      pendingFileName,
      pendingForView,
      view,
      searchTerm,
      isProcessing,
      selectedArea,
      importSite,
      communePage,
      detailPage,
      calMonth,
      calYear,
      calArea,
      selectedDayDetail,
      selectedMonthDetail,
      activeSession,
      currentSessionData,
      allAreasInSession,
      availableSites,
      loadingPharmacySheetSite,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
