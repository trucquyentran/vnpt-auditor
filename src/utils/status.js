export const getStatusTag = (status, isActive) => {
  const s = String(status || "").toLowerCase();
  if (!isActive || s.includes("hết hạn"))
    return "bg-rose-50 text-rose-600 border-rose-100";
  if (s.includes("dùng thử")) return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-emerald-50 text-emerald-600 border-emerald-100";
};
