/**
 * Từ file LAN.xlsx: tính số thuê bao hết hạn năm 2026 và số còn cần phải gia hạn.
 * - Hết hạn trong năm 2026: tính từ 1/1/2026, thuê bao có ngày hết hạn (mới nhất) rơi vào năm 2026.
 * - Còn cần phải gia hạn: trong số hết hạn 2026, trừ đi đã gia hạn đúng hạn và gia hạn sớm.
 *
 * Chạy: node scripts/calc-lan-2026.js
 */

import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { processTransactions } from "../src/utils/transactions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = join(__dirname, "..", "Data");

const LAN_PATH = join(base, "LAN.xlsx");
const DM_XA_PATH = join(base, "DM-Xa.xlsx");

const jan1_2026 = new Date(2026, 0, 1).getTime();

// Đọc LAN.xlsx
const lanBuf = readFileSync(LAN_PATH);
const lanWorkbook = XLSX.read(lanBuf, { type: "buffer" });
const lanSheetName = lanWorkbook.SheetNames[0];
const lanData = XLSX.utils.sheet_to_json(lanWorkbook.Sheets[lanSheetName], {
  defval: "",
});

// Đọc DM-Xa.xlsx (danh mục xã)
const dmBuf = readFileSync(DM_XA_PATH);
const dmWorkbook = XLSX.read(dmBuf, { type: "buffer" });
const dmSheetName = dmWorkbook.SheetNames[0];
const categories = XLSX.utils.sheet_to_json(dmWorkbook.Sheets[dmSheetName], {
  defval: "",
});

// Xử lý giống app (Pharmacy / Long An)
const processed = processTransactions(lanData, categories, "LAN");

// Đếm theo logic app
let expiring2026 = 0;
let giaHanDungHan2026 = 0;
let giaHanSom2026 = 0;
let hetHanTrongNam2026Tu0101 = 0; // Hết hạn (latest) trong năm 2026, từ 1/1/2026

processed.forEach((row) => {
  if (row._isExpiring2026) expiring2026++;
  if (row._isGiaHanDungHan2026) giaHanDungHan2026++;
  if (row._isGiaHanSom2026) giaHanSom2026++;
  const ts = row._expiryTs || 0;
  if (ts >= jan1_2026 && new Date(ts).getFullYear() === 2026) {
    hetHanTrongNam2026Tu0101++;
  }
});

// Số TB còn cần phải gia hạn = Hết hạn 2026 - Đã gia hạn đúng hạn - Đã gia hạn sớm
const conPhaiGiaHan2026 = Math.max(
  0,
  expiring2026 - giaHanDungHan2026 - giaHanSom2026
);

console.log("=== Kết quả từ LAN.xlsx ===\n");
console.log("Tổng hợp đồng (sau gộp theo mã HĐ):", processed.length);
console.log("");
console.log(
  "Số thuê bao hết hạn trong năm 2026 (từ 1/1/2026, có ngày hết hạn rơi vào 2026):",
  hetHanTrongNam2026Tu0101
);
console.log(
  "Số thuê bao hết hạn 2026 (_isExpiring2026, theo logic app):",
  expiring2026
);
console.log("  - Đã gia hạn đúng hạn:", giaHanDungHan2026);
console.log("  - Đã gia hạn sớm:", giaHanSom2026);
console.log("");
console.log(
  "Số thuê bao hết hạn năm 2026 còn cần phải gia hạn (chưa gia hạn):",
  conPhaiGiaHan2026
);
console.log(
  "  (Công thức: Hết hạn 2026 - Gia hạn đúng hạn - Gia hạn sớm =",
  expiring2026,
  "-",
  giaHanDungHan2026,
  "-",
  giaHanSom2026,
  "=",
  conPhaiGiaHan2026,
  ")"
);
