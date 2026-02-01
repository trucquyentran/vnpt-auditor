export const superNormalize = (s) => {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

export const getColumnValue = (row, keywords) => {
  if (!row) return null;
  const keys = Object.keys(row);
  const normKeywords = keywords.map((k) => superNormalize(k));
  for (let key of keys) {
    const normKey = superNormalize(key);
    if (
      normKeywords.some(
        (nk) => normKey === nk || (normKey.length > 4 && normKey.includes(nk))
      )
    )
      return row[key];
  }
  return null;
};
