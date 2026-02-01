/**
 * Test công thức Số TB còn phải gia hạn 2026:
 * conPhaiGiaHan2026 = max(0, expiring2026 - giaHanDungHan2026 - giaHanSom2026)
 * Chạy: node scripts/test-con-phai-gia-han.js
 */

function conPhaiGiaHan2026(expiring2026, giaHanDungHan2026, giaHanSom2026) {
  return Math.max(0, expiring2026 - giaHanDungHan2026 - giaHanSom2026);
}

// Test: kỳ vọng ra 476
const expiring2026 = 500;
const giaHanDungHan2026 = 20;
const giaHanSom2026 = 4;

const result = conPhaiGiaHan2026(
  expiring2026,
  giaHanDungHan2026,
  giaHanSom2026
);

console.log(
  "Công thức: conPhaiGiaHan2026 = max(0, expiring2026 - giaHanDungHan2026 - giaHanSom2026)"
);
console.log(
  "Input: expiring2026 =",
  expiring2026,
  ", giaHanDungHan2026 =",
  giaHanDungHan2026,
  ", giaHanSom2026 =",
  giaHanSom2026
);
console.log("Kết quả:", result);
console.log("Kỳ vọng: 476");
console.log(result === 476 ? "✓ PASS" : "✗ FAIL (kết quả " + result + ")");
