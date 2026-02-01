import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "Data", "LAN.xlsx");

const buf = readFileSync(filePath);
const workbook = XLSX.read(buf, { type: "buffer" });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log("Sheet:", sheetName);
console.log("Total rows:", data.length);
console.log("Columns:", Object.keys(data[0] || {}));
console.log("\n--- First 3 rows (full) ---");
data.slice(0, 3).forEach((row, i) => console.log(JSON.stringify(row, null, 0)));

const addressKeywords = ["Địa chỉ", "Dia chi", "Address", "Địa chỉ hệ thống", "Dia chi he thong"];
let addressCol = null;
for (const key of Object.keys(data[0] || {})) {
  const k = key.toLowerCase().replace(/\s/g, "");
  if (k.includes("diachi") || k.includes("address") || k.includes("địachỉ")) {
    addressCol = key;
    break;
  }
}
if (!addressCol) {
  const keys = Object.keys(data[0] || {});
  addressCol = keys.find((k) => /địa|dia|address/i.test(k)) || keys[0];
}
console.log("\n--- Address column:", addressCol, "---");

const addresses = data.map((r) => String(r[addressCol] || "").trim()).filter(Boolean);
console.log("Non-empty addresses:", addresses.length);
console.log("\n--- All unique address values (first 80) ---");
const unique = [...new Set(addresses)];
unique.slice(0, 80).forEach((a, i) => console.log(`${i + 1}. ${a}`));
if (unique.length > 80) console.log("... and", unique.length - 80, "more");
