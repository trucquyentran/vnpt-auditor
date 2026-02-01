import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { processTransactions } from "../src/utils/transactions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = join(__dirname, "..", "Data");

const lanBuf = readFileSync(join(base, "LAN.xlsx"));
const lanData = XLSX.utils.sheet_to_json(
  XLSX.read(lanBuf, { type: "buffer" }).Sheets["Sheet1"],
  { defval: "" }
);

const dmBuf = readFileSync(join(base, "DM-Xa.xlsx"));
const categories = XLSX.utils.sheet_to_json(
  XLSX.read(dmBuf, { type: "buffer" }).Sheets[
    XLSX.read(dmBuf, { type: "buffer" }).SheetNames[0]
  ],
  { defval: "" }
);

console.log("LAN rows:", lanData.length, "| DM-Xa rows:", categories.length);

const processed = processTransactions(lanData, categories, "LAN");
const unmapped = processed.filter((r) => r._area === "CHƯA PHÂN LOẠI");
const mapped = processed.filter((r) => r._area !== "CHƯA PHÂN LOẠI");

console.log("\nProcessed (unique contracts):", processed.length);
console.log("Mapped:", mapped.length);
console.log("CHƯA PHÂN LOẠI:", unmapped.length);
console.log(
  "Rate:",
  ((mapped.length / processed.length) * 100).toFixed(2) + "%"
);

if (unmapped.length > 0) {
  const byCompare = new Map();
  unmapped.forEach((r) => {
    const k = r._compareValue || "(empty)";
    if (!byCompare.has(k)) byCompare.set(k, []);
    byCompare.get(k).push(r._address?.slice(0, 60));
  });
  console.log("\n--- Unmapped by _compareValue (sample addresses) ---");
  [...byCompare.entries()].slice(0, 40).forEach(([compare, addrs]) => {
    console.log("compare:", JSON.stringify(compare), "| e.g.", addrs[0]);
  });
}
