import XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "Data", "Home.xlsx");

const buf = readFileSync(filePath);
const workbook = XLSX.read(buf, { type: "buffer" });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log("Sheet:", sheetName);
console.log("Total rows:", data.length);
console.log("Columns:", Object.keys(data[0] || {}));
console.log("\n--- First 2 rows ---");
data.slice(0, 2).forEach((row, i) => console.log(JSON.stringify(row, null, 0)));
