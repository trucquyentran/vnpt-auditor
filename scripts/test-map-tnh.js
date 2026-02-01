import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { processTransactions } from "../src/utils/transactions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = join(__dirname, "..", "Data");

const tnhBuf = readFileSync(join(base, "TNH.xlsx"));
const tnhData = XLSX.utils.sheet_to_json(
  XLSX.read(tnhBuf, { type: "buffer" }).Sheets["Sheet1"],
  { defval: "" }
);

const dmBuf = readFileSync(join(base, "DM-Xa.xlsx"));
const categories = XLSX.utils.sheet_to_json(
  XLSX.read(dmBuf, { type: "buffer" }).Sheets[
    XLSX.read(dmBuf, { type: "buffer" }).SheetNames[0]
  ],
  { defval: "" }
);

console.log("TNH rows:", tnhData.length, "| DM-Xa rows:", categories.length);

const processed = processTransactions(tnhData, categories, "TNH");
const unmapped = processed.filter((r) => r._area === "CHƯA PHÂN LOẠI");
const mapped = processed.filter((r) => r._area !== "CHƯA PHÂN LOẠI");

console.log("\nProcessed (unique contracts):", processed.length);
console.log("Mapped:", mapped.length);
console.log("CHƯA PHÂN LOẠI:", unmapped.length);
console.log(
  "Rate:",
  ((mapped.length / processed.length) * 100).toFixed(2) + "%"
);

console.log("\n--- Sample MAPPED (first 15) ---");
mapped.slice(0, 15).forEach((r, i) => {
  console.log(
    i + 1,
    "| so sánh:",
    r._addressSearchValue || r._compareValue,
    "| khu vực:",
    r._area,
    "| địa chỉ:",
    (r._address || "").slice(0, 70) + (r._address?.length > 70 ? "..." : "")
  );
});

if (unmapped.length > 0) {
  const byCompare = new Map();
  unmapped.forEach((r) => {
    const k = r._addressSearchValue || r._compareValue || "(empty)";
    if (!byCompare.has(k)) byCompare.set(k, []);
    byCompare.get(k).push(r._address?.slice(0, 60));
  });
  console.log("\n--- Unmapped by giá trị so sánh (sample addresses) ---");
  [...byCompare.entries()].slice(0, 40).forEach(([compare, addrs]) => {
    console.log("so sánh:", JSON.stringify(compare), "| e.g.", addrs[0]);
  });
}

console.log("\n--- By khu vực (area counts) ---");
const byArea = {};
processed.forEach((r) => {
  const a = r._area || "CHƯA PHÂN LOẠI";
  byArea[a] = (byArea[a] || 0) + 1;
});
Object.entries(byArea)
  .sort((a, b) => b[1] - a[1])
  .forEach(([area, count]) => console.log(count, "|", area));
