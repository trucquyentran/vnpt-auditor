import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "Data", "DM-Xa.xlsx");
const buf = readFileSync(filePath);
const workbook = XLSX.read(buf, { type: "buffer" });
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
console.log("Columns:", Object.keys(data[0] || {}));
console.log("Total rows:", data.length);
console.log("\nFirst 30 rows (Xã, Huyện, Khu vực, Mã tỉnh):");
const cols = Object.keys(data[0] || {});
const xaCol = cols.find((c) => /xã|xa|ten/i.test(c) && /xã|xa/i.test(c)) || cols.find((c) => /xã|xa/i.test(c));
const huyenCol = cols.find((c) => /huyện|huyen|quận|thanh pho/i.test(c));
const kvCol = cols.find((c) => /khu vực|vùng|khuc/i.test(c));
const siteCol = cols.find((c) => /mã tỉnh|ma tinh|site/i.test(c));
console.log("Xã col:", xaCol, "| Huyện col:", huyenCol, "| Khu vực col:", kvCol, "| Site col:", siteCol);
data.slice(0, 30).forEach((r, i) => {
  console.log(i + 1, "|", r[xaCol] || "", "|", r[huyenCol] || "", "|", r[kvCol] || "", "|", r[siteCol] || "");
});
const huyenValues = [...new Set(data.map((r) => String(r[huyenCol] || "").trim()).filter(Boolean))];
console.log("\nUnique Huyện (first 40):", huyenValues.slice(0, 40));
const xaValues = [...new Set(data.map((r) => String(r[xaCol] || "").trim()).filter(Boolean))];
console.log("\nUnique Xã (first 40):", xaValues.slice(0, 40));
