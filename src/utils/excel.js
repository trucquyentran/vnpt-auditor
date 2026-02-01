import ExcelJS from "exceljs";

export const loadXLSX = () => {
  return new Promise((resolve) => {
    if (window.XLSX) return resolve(window.XLSX);
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    document.head.appendChild(script);
  });
};

/** Ánh xạ cột: [key nội bộ, tên cột tiếng Việt, độ rộng] */
const EXPORT_COLUMNS = [
  ["_id", "Mã HĐ", 14],
  ["_customer", "Khách hàng", 28],
  ["_phone", "SĐT", 14],
  ["_taxId", "MST", 14],
  ["_subIdDhs", "Mã TB DHSX", 18],
  ["_area", "Vùng Quản Lý", 16],
  ["_signingDate", "Ngày Ký", 12],
  ["_updateDate", "Ngày Cập Nhật", 14],
  ["_prevExpiryDate", "Hết hạn cũ", 12],
  ["_expiryDate", "Hết hạn mới", 12],
  ["_address", "Địa chỉ liên hệ", 40],
  ["_status", "Trạng thái", 12],
  ["_isExpiring2026", "Hết hạn 2026", 12],
  ["_isPTM", "PTM 2026", 10],
  ["_isGiaHan2026", "Gia hạn 2026", 12],
  ["_isGiaHanTre2025", "Gia hạn trễ 2025", 14],
  ["_isActive", "Còn hiệu lực", 12],
];

const THIN_BORDER = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

/**
 * Xuất toàn bộ dữ liệu đã xử lý ra file Excel (có viền và độ rộng cột).
 * @param {Object[]} data - Mảng các bản ghi
 * @param {string} [fileName] - Tên file (không cần .xlsx)
 */
export async function exportToExcel(data, fileName) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return Promise.reject(new Error("Không có dữ liệu để xuất."));
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Du lieu", {
    views: [{ showGridLines: true }],
  });

  const colCount = EXPORT_COLUMNS.length;
  sheet.columns = EXPORT_COLUMNS.map(([, label, width]) => ({
    header: label,
    key: label,
    width: width || 12,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  for (let c = 1; c <= colCount; c++) {
    headerRow.getCell(c).border = THIN_BORDER;
  }

  data.forEach((item) => {
    const rowObj = {};
    EXPORT_COLUMNS.forEach(([key, label]) => {
      let val = item[key];
      if (val === true) val = "Có";
      if (val === false) val = "Không";
      rowObj[label] = val != null ? val : "";
    });
    const row = sheet.addRow(rowObj);
    row.alignment = { vertical: "middle", wrapText: false };
    for (let c = 1; c <= colCount; c++) {
      row.getCell(c).border = THIN_BORDER;
    }
  });

  const name =
    fileName && String(fileName).trim()
      ? String(fileName).replace(/\.xlsx?$/i, "")
      : `xuat-du-lieu_${new Date().toISOString().slice(0, 10)}_${new Date()
          .toTimeString()
          .slice(0, 5)
          .replace(":", "-")}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
