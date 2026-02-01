export const parseDate = (val) => {
  if (!val) return 0;
  if (val instanceof Date) return val.getTime();
  if (typeof val === "number") {
    if (val >= 1 && val < 100000)
      return new Date((val - 25569) * 86400 * 1000).getTime();
    return val;
  }
  const str = String(val).trim().replace(/[.-]/g, "/");
  const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy)
    return new Date(
      Number(dmy[3]),
      Number(dmy[2]) - 1,
      Number(dmy[1])
    ).getTime();
  const ts = Date.parse(str);
  return isNaN(ts) ? 0 : ts;
};

export const formatDateDisplay = (val) => {
  const ts = parseDate(val);
  if (!ts || ts === 0) return "---";
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

/** Chuẩn hóa giá trị ngày sang YYYY-MM-DD để so sánh với input[type=date]. Trả về "" nếu không parse được. */
export const dateToYYYYMMDD = (val) => {
  const ts = parseDate(val);
  if (!ts || ts === 0) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Chuẩn hóa giá trị ngày sang YYYY-MM (tháng/năm) để so sánh với input[type=month]. Trả về "" nếu không parse được. */
export const dateToYYYYMM = (val) => {
  const ts = parseDate(val);
  if (!ts || ts === 0) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
