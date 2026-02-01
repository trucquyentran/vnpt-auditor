/**
 * Lấy dữ liệu danh mục mặc định (DM-Xa) từ Google Sheets.
 * Sheet: https://docs.google.com/spreadsheets/d/1hMke_Xt_9R99GCZQHNla00s8gUM7x2qkxHevnfKaC54
 * Cột: Tên xã/phường, Huyện/Thị xã/TP, Khu vực, Site
 */

export const DEFAULT_DM_SHEET_ID =
  "1hMke_Xt_9R99GCZQHNla00s8gUM7x2qkxHevnfKaC54";

const EXPORT_URL = (sheetId, gid = "") =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${
    gid !== "" ? `&gid=${gid}` : ""
  }`;

/** URL xuất CSV qua Google Visualization API (có thể trả về đủ dữ liệu hơn khi proxy cắt export) */
const GVIZ_CSV_URL = (sheetId) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

/** Chuẩn hóa tên cột: bỏ BOM, trim. */
function normalizeHeaderKey(h) {
  if (h == null) return "";
  return String(h)
    .trim()
    .replace(/^\uFEFF/, "");
}

/** Chuẩn hóa chuỗi để so khớp tên cột (bỏ dấu, lowercase). */
function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/** Kiểm tra một dòng có phải header Pharmacy (có từ khóa đặc trưng) không. */
function looksLikePharmacyHeader(cells) {
  if (!cells || cells.length < 3) return false;
  const joined = cells.map((c) => String(c || "").toLowerCase()).join(" ");
  return (
    joined.includes("mã hợp đồng") ||
    joined.includes("ma hop dong") ||
    joined.includes("địa chỉ") ||
    joined.includes("dia chi") ||
    joined.includes("ngày hết hạn") ||
    joined.includes("ngay het han")
  );
}

/** Tên cột Pharmacy cần có ít nhất một (để nhận dạng đúng bảng). */
const PHARMACY_HEADER_NORMS = [
  "mahopdong",
  "mahd",
  "sohopdong",
  "contractid",
  "contract",
  "diachi",
  "diachihethong",
  "address",
  "ngayhethan",
  "handung",
  "hethan",
  "expiry",
  "expdate",
];

/** Kiểm tra dữ liệu đã parse có đúng format Pharmacy (có ít nhất một cột Mã HĐ/Địa chỉ/Ngày hết hạn). */
function looksLikePharmacyData(data) {
  if (!data || data.length === 0) return true;
  const keys = Object.keys(data[0]);
  for (const k of keys) {
    const n = normKey(k);
    if (
      PHARMACY_HEADER_NORMS.some(
        (kw) => n.includes(kw) || (kw.length >= 4 && n.includes(kw))
      )
    )
      return true;
  }
  return false;
}

/** Tách một dòng CSV thành mảng cell theo delimiter, hỗ trợ field trong ngoặc kép. */
function splitCSVLine(line, delimiter = ",") {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === delimiter) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += c;
  }
  cells.push(cell.trim());
  return cells;
}

/** Parse CSV text thành mảng object (hàng đầu = header). Hỗ trợ BOM, dấu phẩy hoặc chấm phẩy, hàng đầu có thể là tiêu đề. */
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  let s = csvText.trimStart();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (current.trim()) lines.push(current);
      current = "";
      if (c === "\r" && s[i + 1] === "\n") i++;
      continue;
    }
    current += c;
  }
  if (current.trim()) lines.push(current);

  // Xác định delimiter: ưu tiên từ dòng có nhiều cột (thường là header). Dòng tiêu đề "LAN"/"Báo cáo" có thể không có dấu phẩy.
  let delimiter = ",";
  for (let tryRow = 0; tryRow < Math.min(3, lines.length); tryRow++) {
    const line = lines[tryRow] || "";
    let commaCount = 0,
      semicolonCount = 0,
      inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQ = !inQ;
      if (!inQ) {
        if (line[i] === ",") commaCount++;
        if (line[i] === ";") semicolonCount++;
      }
    }
    if (semicolonCount > commaCount) {
      delimiter = ";";
      break;
    }
    if (commaCount > 0) break;
  }

  let rows = lines.map((line) => splitCSVLine(line, delimiter));

  if (rows.length === 0) return [];

  let headerRowIndex = 0;
  if (
    rows.length > 1 &&
    !looksLikePharmacyHeader(rows[0]) &&
    looksLikePharmacyHeader(rows[1])
  ) {
    headerRowIndex = 1;
  }

  // Nếu hàng header khi tách bằng delimiter hiện tại chỉ có 1 cột mà nội dung chứa dấu khác → thử delimiter kia
  const headerCells = rows[headerRowIndex];
  if (
    headerCells &&
    headerCells.length === 1 &&
    (headerCells[0].includes(";") || headerCells[0].includes(","))
  ) {
    const altDelimiter = delimiter === "," ? ";" : ",";
    rows = lines.map((line) => splitCSVLine(line, altDelimiter));
  }

  const headers = rows[headerRowIndex].map(
    (h) => normalizeHeaderKey(h) || null
  );
  const dataStart = headerRowIndex + 1;

  const numHeaders = headers.length;
  return rows.slice(dataStart).map((cells) => {
    const obj = {};
    for (let i = 0; i < numHeaders; i++) {
      const key =
        headers[i] && headers[i].length > 0 ? headers[i] : `Col${i + 1}`;
      const raw = i < cells.length ? cells[i] : "";
      obj[key] = raw != null ? String(raw).trim() : "";
    }
    return obj;
  });
}

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Lấy nội dung CSV từ một URL: thử trực tiếp, sau đó lần lượt qua từng CORS proxy.
 * @param {string} url - URL xuất CSV
 * @returns {Promise<{ text: string, byteLength: number }>}
 */
async function fetchRawCSV(url) {
  let text = "";
  let lastError = null;

  try {
    const direct = await fetch(url, { mode: "cors" });
    if (direct.ok) {
      text = await direct.text();
      return { text, byteLength: new Blob([text]).size };
    }
    throw new Error(String(direct.status));
  } catch (e) {
    lastError = e;
    for (const proxyFn of CORS_PROXIES) {
      try {
        const res = await fetch(proxyFn(url));
        if (res.ok) {
          text = await res.text();
          lastError = null;
          return { text, byteLength: new Blob([text]).size };
        }
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw new Error(
    lastError?.message ||
      "Không tải được dữ liệu từ URL (thử kiểm tra quyền chia sẻ sheet)."
  );
}

/**
 * Fetch Google Sheet dạng CSV. Thử trực tiếp trước, sau đó lần lượt qua từng CORS proxy.
 * @param {string} sheetId - ID sheet (từ URL: /d/SHEET_ID/edit)
 * @param {{ gid?: number }} [opts] - gid: ID sheet con (0 = sheet đầu tiên) nếu workbook có nhiều sheet
 * @returns {Promise<Object[]>} Mảng object, mỗi object là một hàng (key = tên cột)
 */
export async function fetchGoogleSheetAsCSV(sheetId, opts = {}) {
  const gid = opts.gid != null ? String(opts.gid) : "";
  const url = EXPORT_URL(sheetId, gid);
  const { text } = await fetchRawCSV(url);
  if (!text || text.trim().length === 0) {
    throw new Error(
      "Không tải được dữ liệu từ Google Sheet (thử kiểm tra quyền chia sẻ sheet)."
    );
  }
  return parseCSV(text);
}

/**
 * Lấy danh mục mặc định (DM-Xa) từ Google Sheet.
 * @returns {Promise<Object[]>} Danh sách xã/phường (Tên xã/phường, Huyện/Thị xã/TP, Khu vực, Site)
 */
export async function fetchDefaultCategories() {
  return fetchGoogleSheetAsCSV(DEFAULT_DM_SHEET_ID);
}

/**
 * ID Google Sheet dữ liệu Pharmacy theo site (LAN, TNH).
 * Có thể là chuỗi (id) hoặc object { id, gid } nếu bảng nằm ở tab khác (gid lấy từ URL khi mở tab).
 */
export const PHARMACY_SHEET_IDS = {
  LAN: "1QCxqGYcs_SI2aT_mIRBugoyankVMfmJrG7IVWLtunjo",
  TNH: "1OrfyQAd-oss0eIw0yvyUkIedmmXFfL1GYul9PEsR68A",
};

function getPharmacySheetIdAndGid(site) {
  const raw = PHARMACY_SHEET_IDS[site];
  if (!raw) return { id: null, gid: "" };
  if (typeof raw === "string") return { id: raw, gid: "" };
  const id = raw.id || raw;
  const gid = raw.gid != null ? String(raw.gid) : "";
  return { id, gid };
}

/**
 * Lấy dữ liệu phân tích Pharmacy từ Google Sheet theo site.
 * Ưu tiên export?format=csv (đúng cấu trúc); chỉ dùng gviz khi export lỗi. Chỉ chấp nhận dữ liệu có header đúng format Pharmacy.
 * @param {"LAN"|"TNH"} site - LAN hoặc TNH
 * @returns {Promise<{ data: Object[], rowCount: number, byteLength: number, source: string }>}
 */
export async function fetchPharmacySheet(site) {
  const { id: sheetId, gid } = getPharmacySheetIdAndGid(site);
  if (!sheetId) throw new Error(`Không hỗ trợ site: ${site}`);

  const exportUrl = EXPORT_URL(sheetId, gid);
  const gvizUrl = GVIZ_CSV_URL(sheetId);

  /** Thử một nguồn, trả về { data, byteLength, source } nếu thành công và data hợp lệ. */
  const trySource = async (url, sourceName) => {
    try {
      const { text, byteLength } = await fetchRawCSV(url);
      if (!text || !text.trim()) return null;
      const data = parseCSV(text);
      if (!looksLikePharmacyData(data)) return null;
      return { data, rowCount: data.length, byteLength, source: sourceName };
    } catch (_) {
      return null;
    }
  };

  // Ưu tiên export (đúng cấu trúc); gviz thường sai header hoặc ghép hàng
  const exportResult = await trySource(exportUrl, "export");
  if (exportResult != null) return exportResult;

  const gvizResult = await trySource(gvizUrl, "gviz");
  if (gvizResult != null) return gvizResult;

  throw new Error(
    'Không đọc được dữ liệu Pharmacy từ Google Sheet. Kiểm tra: (1) Quyền chia sẻ "Anyone with the link", (2) Bảng có cột Mã hợp đồng / Địa chỉ / Ngày hết hạn, (3) Nếu có nhiều tab thì cấu hình gid trong PHARMACY_SHEET_IDS.'
  );
}

/**
 * Lấy raw CSV text từ Google Sheet (dùng export?format=csv, qua proxy nếu CORS).
 * Dùng khi muốn parse bằng XLSX trong AppContext.
 * @param {string} sheetId - ID sheet
 * @param {{ gid?: number|string }} [opts] - gid nếu có nhiều tab
 * @returns {Promise<string>}
 */
export async function fetchGoogleSheetCSVText(sheetId, opts = {}) {
  const gid = opts.gid != null ? String(opts.gid) : "";
  const url = EXPORT_URL(sheetId, gid);
  const { text } = await fetchRawCSV(url);
  return text || "";
}

/**
 * Lấy raw CSV text từ sheet Pharmacy theo site (LAN/TNH).
 * @param {"LAN"|"TNH"} site
 * @returns {Promise<string>}
 */
export async function fetchPharmacySheetCSVText(site) {
  const { id: sheetId, gid } = getPharmacySheetIdAndGid(site);
  if (!sheetId) throw new Error(`Không hỗ trợ site: ${site}`);
  const url = EXPORT_URL(sheetId, gid);
  const { text } = await fetchRawCSV(url);
  return text || "";
}
