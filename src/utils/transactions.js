import { superNormalize, getColumnValue } from "./normalize.js";
import { parseDate, formatDateDisplay } from "./date.js";

/** Chuẩn hóa chuỗi địa chỉ: chữ thường, thống nhất mọi dấu phẩy (ASCII, fullwidth, ideographic, ;, -), bỏ khoảng trắng dư, bỏ dấu câu cuối. Nếu có dấu | thì lấy phần đầu. */
function normalizeAddressString(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  if (s.includes("|")) s = s.split("|")[0].trim();
  s = s
    .replace(/\u00A0/g, " ")
    .replace(/[\u002C\uFF0C\u3001\u060C\u201A\u2022]/g, ",")
    .replace(/;/g, ",")
    .replace(/-/g, ",")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim()
    .replace(/[.,;:\s]+$/, "");
  return s;
}

/**
 * Loại bỏ phần tỉnh và quốc gia ở cuối địa chỉ.
 * - Có tiền tố "tỉnh": bỏ đoạn đó.
 * - Không có tiền tố tỉnh: vẫn xác định bằng dấu phẩy cuối cùng; nếu đoạn cuối (sau dấu ,) là tên tỉnh/quốc gia thì cũng bỏ.
 * @param {string} s - Chuỗi địa chỉ đã chuẩn hóa
 * @param {string[]} provinceNamesNormalized - Danh sách tên tỉnh đã chuẩn hóa (superNormalize) từ danh mục
 */
function stripProvinceAndCountry(s, provinceNamesNormalized = []) {
  if (!s) return "";
  const parts = s
    .trim()
    .split(",")
    .map((x) => x.trim().replace(/[.,;:\s]+$/, ""))
    .filter((x) => x.length > 0);
  const dropPatterns = [
    /^tỉnh\s+/i,
    /^t\.?\s*/i,
    /^việt nam$/i,
    /^viet nam$/i,
    /^vn$/i,
    /^quốc gia\s+/i,
  ];
  const provinceSet = new Set(provinceNamesNormalized);
  while (parts.length > 0) {
    const last = parts[parts.length - 1];
    const isWithPrefix = dropPatterns.some((p) => p.test(last));
    const isProvinceNameNoPrefix = provinceSet.has(superNormalize(last));
    if (isWithPrefix || isProvinceNameNoPrefix) parts.pop();
    else break;
  }
  return parts.join(", ");
}

/** Bỏ tên tỉnh/quốc gia ở cuối một đoạn (vd: "phường 6 tp tân an long an" -> "phường 6 tp tân an") */
function stripProvinceFromSegmentEnd(segment, provinceNamesNormalized) {
  let s = String(segment || "")
    .trim()
    .replace(/[.,;:\s]+$/, "");
  const dropEndPatterns = [
    /,?\s*tỉnh\s+long an\.?\s*$/i,
    /,?\s*tỉnh\s+tây ninh\.?\s*$/i,
    /,?\s*long an\.?\s*$/i,
    /,?\s*tây ninh\.?\s*$/i,
    /,?\s*việt nam\.?\s*$/i,
    /,?\s*viet nam\.?\s*$/i,
  ];
  for (const p of dropEndPatterns) {
    s = s.replace(p, "").trim();
  }
  if (provinceNamesNormalized.length) {
    const parts = s.split(/\s+/);
    while (parts.length > 0) {
      const lastWord = parts[parts.length - 1].replace(/[.,]+$/, "");
      if (provinceNamesNormalized.includes(superNormalize(lastWord)))
        parts.pop();
      else break;
    }
    s = parts.join(" ").trim();
  }
  return s;
}

/** Xóa tiền tố huyện, xã, phường, thị trấn, quận, tp/thành phố, thị xã, ấp khỏi chuỗi. Hỗ trợ cả p./f. không có khoảng sau (vd: p.Hiệp Ninh). */
const ADMIN_PREFIX_REGEX =
  /^(huyện|huyen|xa|xã|phường|phuong|quận|quan|thị trấn|thi tran|thị xã|thi xa|tx|tt|tp|thanh pho|thành phố|ấp|ap|p\.?|f\.?)\s+/i;
const ADMIN_PREFIX_P_DOT_REGEX = /^(p\.|f\.)\s*/i;
function removeAdminPrefix(segment) {
  let s = String(segment || "").trim();
  s = s.replace(ADMIN_PREFIX_REGEX, "").trim();
  s = s.replace(ADMIN_PREFIX_P_DOT_REGEX, "").trim();
  return s;
}

/**
 * Chuẩn hóa địa chỉ rồi trích phần cuối (luôn xác định bằng dấu phẩy cuối cùng), bỏ tiền tố admin.
 * Khi không có tiền tố "tỉnh", vẫn dùng dấu , cuối cùng; nếu đoạn cuối là tên tỉnh (từ danh mục) thì bỏ.
 */
export function getAddressTailForMapping(
  rawAddress,
  provinceNamesNormalized = []
) {
  const candidates = getAddressTailCandidates(
    rawAddress,
    provinceNamesNormalized
  );
  return candidates[0] || "";
}

/** Giá trị so sánh hiển thị: ưu tiên xã/phường (candidate thứ 2 nếu có), không phải huyện/thị xã. */
export function getAddressTailForDisplay(
  rawAddress,
  provinceNamesNormalized = []
) {
  const candidates = getAddressTailCandidates(
    rawAddress,
    provinceNamesNormalized
  );
  if (candidates.length >= 2) return candidates[1] || "";
  return candidates[0] || "";
}

/**
 * Trích mọi phần con từ một đoạn (tách theo dấu phẩy hoặc khoảng trắng khi không có phẩy), từ cuối lên đầu, đã bỏ tỉnh và tiền tố admin.
 */
function _segmentToCandidates(seg, provinceNamesNormalized) {
  let s = stripProvinceFromSegmentEnd(seg, provinceNamesNormalized);
  let parts = s
    .split(/\s*[,，\uFF0C\u3001;]+\s*/)
    .map((x) => x.trim().replace(/[.,;:\s]+$/, ""))
    .filter(Boolean);
  if (parts.length <= 1 && s.trim().includes(" ")) {
    const words = s.trim().split(/\s+/).filter(Boolean);
    parts = [];
    for (let n = 1; n <= Math.min(4, words.length); n++) {
      parts.push(words.slice(-n).join(" "));
    }
  }
  const out = [];
  for (let i = parts.length - 1; i >= 0; i--) {
    const cleaned = removeAdminPrefix(parts[i]);
    if (cleaned && !out.includes(cleaned)) out.push(cleaned);
  }
  return out;
}

/** Tách chuỗi theo dấu phẩy (ASCII, fullwidth, ideographic) hoặc " - " để có đoạn địa chỉ */
function splitAddressSegments(s) {
  return s
    .split(/\s*[,，\uFF0C\u3001;]+\s*|\s+-\s+/)
    .map((x) => x.trim().replace(/[.,;:\s]+$/, ""))
    .filter((x) => x.length > 0);
}

/** Đoạn là chi tiết địa chỉ (số nhà, đường, ấp, khu phố, tổ) - KHÔNG so với danh mục xã/huyện */
const ADDRESS_DETAIL_PATTERNS = [
  /^\d+(\/\d+)?\.?$/, // 388/5, 286
  /^số\s+nhà\s+/i,
  /^số\s+\d+/i,
  /^so\s+nha\s+/i,
  /^đường\s+/i,
  /^duong\s+/i,
  /^đ\.\s*/i,
  /^ấp\s+/i,
  /^ap\s+/i,
  /^khu\s+\d+/i,
  /^kp\s+/i, // khu phố
  /^khu phố\s+/i,
  /^khu pho\s+/i,
  /^tổ\s+/i, // tổ
  /^to\s+/i,
];
function isAddressDetailSegment(seg) {
  const s = String(seg || "")
    .trim()
    .toLowerCase();
  return ADDRESS_DETAIL_PATTERNS.some((p) => p.test(s));
}

/**
 * Trả về danh sách ứng viên để so khớp:
 * - Candidate 1 (huyện): chỉ phần cuối sau dấu phẩy (đoạn cuối địa chỉ) → so huyện/thị xã trước.
 * - Candidate 2 (xã): đoạn áp chót (chuỗi cuối địa chỉ cho xã) → nếu chưa có kết quả mới so tiếp.
 * KHÔNG so số nhà, đường, ấp với danh mục xã/huyện.
 */
function getAddressTailCandidates(rawAddress, provinceNamesNormalized = []) {
  const step1 = normalizeAddressString(rawAddress);
  const step2 = stripProvinceAndCountry(step1, provinceNamesNormalized);
  let segments = splitAddressSegments(step2);
  if (segments.length === 0) return [];

  if (segments.length > 1) segments = segments.slice(1);

  const adminSegments = segments.filter((seg) => !isAddressDetailSegment(seg));
  if (adminSegments.length === 0) return [];

  const candidates = [];
  const seen = new Set();

  const lastSeg = stripProvinceFromSegmentEnd(
    adminSegments[adminSegments.length - 1],
    provinceNamesNormalized
  );
  const forHuyen = removeAdminPrefix(lastSeg);
  if (forHuyen && !seen.has(superNormalize(forHuyen))) {
    seen.add(superNormalize(forHuyen));
    candidates.push(forHuyen);
  }

  if (adminSegments.length >= 2) {
    const secondLastSeg = stripProvinceFromSegmentEnd(
      adminSegments[adminSegments.length - 2],
      provinceNamesNormalized
    );
    const forXa = removeAdminPrefix(secondLastSeg);
    if (forXa && !seen.has(superNormalize(forXa))) {
      seen.add(superNormalize(forXa));
      candidates.push(forXa);
    }
  }

  if (candidates.length === 0) {
    const extracted = removeAdminPrefix(lastSeg);
    if (extracted) candidates.push(extracted);
  }

  return candidates;
}

/**
 * Map địa chỉ (raw) sang khu vực theo danh mục xã/huyện.
 * Dùng chung cho Pharmacy và Home&Clinic.
 */
function mapAddressToArea(
  rawAddr,
  dictionary,
  targetSite,
  provinceNamesNormalized
) {
  let bestMatch = { area: "CHƯA PHÂN LOẠI", site: targetSite || "N/A" };
  const tailCandidates = getAddressTailCandidates(
    rawAddr,
    provinceNamesNormalized
  );
  let matchedNormTail = "";

  for (const tail of tailCandidates) {
    const normTail = superNormalize(tail);
    if (!normTail) continue;
    const foundByHuyen = dictionary.find(
      (d) =>
        (targetSite ? d.site === targetSite : true) &&
        d.cleanHuyen &&
        d.cleanHuyen === normTail
    );
    if (foundByHuyen) {
      bestMatch.area = foundByHuyen.area;
      matchedNormTail = normTail;
      break;
    }
    const foundByXa = dictionary.find(
      (d) =>
        (targetSite ? d.site === targetSite : true) &&
        d.cleanXa &&
        d.cleanXa === normTail
    );
    if (foundByXa) {
      bestMatch.area = foundByXa.area;
      matchedNormTail = normTail;
      break;
    }
  }

  const normTail =
    matchedNormTail ||
    (tailCandidates[0] ? superNormalize(tailCandidates[0]) : "");

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const addrLower = (rawAddr || "").toLowerCase();
    if (
      /tp\.?\s*tân an|thanh pho\s*tân an|phường\s+\d.*tân an|tân an.*long an/i.test(
        addrLower
      ) ||
      addrLower.includes("tp tân an") ||
      addrLower.includes("thành phố tân an")
    ) {
      const tanAnArea = dictionary.find(
        (d) =>
          (targetSite ? d.site === targetSite : true) &&
          d.cleanHuyen === "tanan"
      );
      if (tanAnArea) bestMatch.area = tanAnArea.area;
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const addrLower = (rawAddr || "").toLowerCase();
    if (
      /tp\.?\s*tây ninh|tp\.?\s*tay ninh|thanh pho\s*tây ninh|thanh pho\s*tay ninh|phường\s+\d.*tây ninh|phường\s+\d.*tay ninh|tây ninh.*tây ninh|tay ninh.*tay ninh/i.test(
        addrLower
      ) ||
      addrLower.includes("tp tây ninh") ||
      addrLower.includes("tp tay ninh") ||
      addrLower.includes("thành phố tây ninh") ||
      addrLower.includes("thanh pho tay ninh")
    ) {
      const tayNinhArea = dictionary.find(
        (d) =>
          (targetSite ? d.site === targetSite : true) &&
          (d.cleanHuyen === "tayninh" || d.cleanXa === "tayninh")
      );
      if (tayNinhArea) bestMatch.area = tayNinhArea.area;
      else if (targetSite === "TNH") bestMatch.area = "VNPT khu vực Tân Ninh";
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const normalizedAddr = (rawAddr || "").toLowerCase().replace(/-/g, " - ");
    const patternsLongAn = [
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*([^,-]+?)\s*-\s*long an/i,
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*long an/i,
      /-\s*([^,-]+?)\s*-\s*long an\s*\.?$/i,
    ];
    const huyenCandidates = [];
    for (const re of patternsLongAn) {
      const m = normalizedAddr.match(re);
      if (m) {
        const name = (m[1] || m[2] || "").trim();
        if (name && name !== "long an") huyenCandidates.push(name);
        if (m[2] && m[2].trim() !== "long an")
          huyenCandidates.push(m[2].trim());
      }
    }
    for (const name of huyenCandidates) {
      const n = superNormalize(removeAdminPrefix(name));
      if (!n) continue;
      const found = dictionary.find(
        (d) =>
          (targetSite ? d.site === targetSite : true) &&
          (d.cleanHuyen === n || d.cleanXa === n)
      );
      if (found) {
        bestMatch.area = found.area;
        break;
      }
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const normalizedAddr = (rawAddr || "").toLowerCase().replace(/-/g, " - ");
    const patternsTayNinh = [
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*([^,-]+?)\s*-\s*tây ninh/i,
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*tây ninh/i,
      /-\s*([^,-]+?)\s*-\s*tây ninh\s*\.?$/i,
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*([^,-]+?)\s*-\s*tay ninh/i,
      /(?:thị trấn|thi tran|huyện|huyen|thị xã|thi xa)\s+([^,-]+?)\s*-\s*tay ninh/i,
      /-\s*([^,-]+?)\s*-\s*tay ninh\s*\.?$/i,
    ];
    const huyenCandidatesTN = [];
    for (const re of patternsTayNinh) {
      const m = normalizedAddr.match(re);
      if (m) {
        const name = (m[1] || m[2] || "").trim();
        if (name && name !== "tây ninh" && name !== "tay ninh")
          huyenCandidatesTN.push(name);
        if (m[2] && m[2].trim() !== "tây ninh" && m[2].trim() !== "tay ninh")
          huyenCandidatesTN.push(m[2].trim());
      }
    }
    for (const name of huyenCandidatesTN) {
      const n = superNormalize(removeAdminPrefix(name));
      if (!n) continue;
      const found = dictionary.find(
        (d) =>
          (targetSite ? d.site === targetSite : true) &&
          (d.cleanHuyen === n || d.cleanXa === n)
      );
      if (found) {
        bestMatch.area = found.area;
        break;
      }
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const addrLower = (rawAddr || "").toLowerCase();
    const hasLongAnArea =
      normTail === "longan" ||
      /phường\s+long an|phuong\s+long an/i.test(addrLower);
    if (hasLongAnArea && targetSite === "LAN") {
      const longAnArea = dictionary.find(
        (d) =>
          d.site === targetSite &&
          (d.cleanHuyen === "longan" || d.cleanXa === "longan")
      );
      if (longAnArea) bestMatch.area = longAnArea.area;
      else bestMatch.area = "VNPT Khu vực Long An";
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const addrLower = (rawAddr || "").toLowerCase();
    const hasTayNinhArea =
      normTail === "tayninh" ||
      /phường\s+tây ninh|phuong\s+tây ninh|phường\s+tay ninh|phuong\s+tay ninh/i.test(
        addrLower
      );
    if (hasTayNinhArea && targetSite === "TNH") {
      const tayNinhArea = dictionary.find(
        (d) =>
          d.site === targetSite &&
          (d.cleanHuyen === "tayninh" || d.cleanXa === "tayninh")
      );
      if (tayNinhArea) bestMatch.area = tayNinhArea.area;
      else bestMatch.area = "VNPT khu vực Tân Ninh";
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const addrNorm = (rawAddr || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const tryHuyen = (nameNorm, cleanKey) => {
      const found = dictionary.find(
        (d) =>
          (targetSite ? d.site === targetSite : true) &&
          d[cleanKey] === nameNorm
      );
      if (found) bestMatch.area = found.area;
    };
    if (addrNorm.includes("tan thanh") || addrNorm.includes("tân thạnh"))
      tryHuyen("tanthanh", "cleanHuyen");
    if (
      bestMatch.area === "CHƯA PHÂN LOẠI" &&
      (addrNorm.includes("thu thua") ||
        addrNorm.includes("thủ thừa") ||
        (addrNorm.includes("tan lap") && addrNorm.includes("thu thua")))
    )
      tryHuyen("thuthua", "cleanHuyen");
    if (bestMatch.area === "CHƯA PHÂN LOẠI" && targetSite === "TNH") {
      const tayNinhHuyen = [
        ["tan chau", "tanchau"],
        ["chau thanh", "chauthanh"],
        ["trang bang", "trangbang"],
        ["hiep ninh", "hiepninh"],
        ["ben cau", "bencau"],
        ["go dau", "godau"],
        ["duong minh chau", "duongminhchau"],
      ];
      for (const [keyword, cleanKey] of tayNinhHuyen) {
        if (addrNorm.includes(keyword)) {
          tryHuyen(cleanKey, "cleanHuyen");
          if (bestMatch.area !== "CHƯA PHÂN LOẠI") break;
        }
      }
    }
  }

  if (
    bestMatch.area === "CHƯA PHÂN LOẠI" &&
    !(tailCandidates[0] ? superNormalize(tailCandidates[0]) : "")
  ) {
    if (targetSite === "LAN") bestMatch.area = "VNPT Khu vực Long An";
    else if (targetSite === "TNH") bestMatch.area = "VNPT khu vực Tân Ninh";
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI") {
    const wardMatch = (rawAddr || "").match(
      /\b(phuong|p|f|p\.|f\.)\s?(\d{1,2})\b/i
    );
    if (wardMatch) {
      if (targetSite === "TNH") bestMatch.area = "VNPT khu vực Tân Ninh";
      else if (targetSite === "LAN") bestMatch.area = "VNPT Khu vực Long An";
    }
  }

  if (bestMatch.area === "CHƯA PHÂN LOẠI" && targetSite === "TNH") {
    const addrNorm = (rawAddr || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const normCandidates = tailCandidates
      .map((t) => superNormalize(t))
      .filter(Boolean);
    const hoaThanhXa = new Set([
      "hoathanh",
      "hieptan",
      "longthanhtrung",
      "longthanhnam",
      "longthanhbac",
      "truongtay",
      "truongdong",
      "truonghoa",
    ]);
    const tanBienXa = new Set(["tanbien", "thanhtay", "thanhbac", "tanphong"]);
    const hasHoaThanh =
      normCandidates.some((n) => hoaThanhXa.has(n)) ||
      /hoa\s*thanh|hoà\s*thanh|thi\s*tran\s*hoa\s*thanh|thi\s*xa\s*hoa\s*thanh|tx\s*hoa\s*thanh/i.test(
        addrNorm.replace(/\s/g, " ")
      );
    const hasTanBien =
      normCandidates.some((n) => tanBienXa.has(n)) ||
      (/tan\s*bien|tân\s*biên/.test(addrNorm.replace(/\s/g, " ")) &&
        /thanh\s*tay|thanh\s*bac|tan\s*phong|thạnh\s*tây|thạnh\s*bắc|tân\s*phong/i.test(
          addrNorm
        ));
    if (hasHoaThanh) bestMatch.area = "VNPT Khu vực Hòa Thành";
    else if (hasTanBien) bestMatch.area = "VNPT Khu vực Tân Biên";
    else if (
      addrNorm.includes("hoa thanh") ||
      addrNorm.includes("hoà thanh") ||
      addrNorm.includes("thi tran hoa thanh") ||
      addrNorm.includes("thi xa hoa thanh")
    )
      bestMatch.area = "VNPT Khu vực Hòa Thành";
    else if (
      addrNorm.includes("tan bien") &&
      (addrNorm.includes("thanh tay") ||
        addrNorm.includes("thanh bac") ||
        addrNorm.includes("tan phong"))
    )
      bestMatch.area = "VNPT Khu vực Tân Biên";
  }

  return bestMatch;
}

export const tokenizeAddress = (
  addressRaw,
  pKeywords = [],
  provinceNamesNormalized = []
) => {
  if (!addressRaw) return [];
  let s = normalizeAddressString(addressRaw);
  s = stripProvinceAndCountry(s, provinceNamesNormalized);
  let segments = s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  const junk = [
    "long an",
    "tây ninh",
    "tay ninh",
    "việt nam",
    "viet nam",
    "vn",
    "v.n",
    ...pKeywords,
  ];
  let filtered = segments.filter((seg) => {
    const lowSeg = seg.replace(/\.+$/, "").trim();
    const isAdminUnit = /\b(phường|p|xã|thị trấn|tt|quận|huyện)\b/i.test(
      lowSeg
    );
    const isProvinceName = junk.some(
      (j) => lowSeg === j || lowSeg.includes(`tỉnh ${j}`)
    );
    return !isProvinceName || isAdminUnit;
  });
  return filtered.length === 0 && segments.length > 0
    ? [segments[segments.length - 1]]
    : filtered;
};

/**
 * Xử lý giao dịch - mapping địa chỉ theo danh mục
 */
export const processTransactions = (data, categories, targetSite) => {
  if (!data.length) return [];
  const now = new Date().getTime();

  const kwContract = [
    "Mã hợp đồng",
    "Ma HD",
    "So hop dong",
    "Mã HĐ",
    "Contract ID",
  ];
  const kwExpiryNames = [
    "Ngày hết hạn",
    "Hạn dùng",
    "han dung",
    "ngay het han",
    "het han",
    "expiry",
    "exp date",
  ];
  const kwSigning = ["Ngày Ký Hợp đồng", "Ngày ký", "Ngay ky", "Signing Date"];
  const kwUpdate = ["Ngày cập nhật", "Ngày sửa", "Update Date"];
  const kwGiaHan = ["Ngày gia hạn", "Ngay gia han", "Renewal Date"];
  const kwCustomer = [
    "Tên khách hàng",
    "Khách hàng",
    "Don vi",
    "Customer Name",
  ];
  const kwAddress = ["Địa chỉ", "Dia chi", "Địa chỉ hệ thống", "Address"];
  const kwPhone = [
    "Số Điện thoại",
    "SDT",
    "SĐT",
    "Phone",
    "Di động",
    "Mobile",
    "Liên hệ",
  ];

  const defaultProvinces = ["Long An", "Tây Ninh", "Tay Ninh"];
  const provinceNamesNormalized = (() => {
    const names = new Set(defaultProvinces.map((p) => superNormalize(p)));
    categories.forEach((c) => {
      const p = getColumnValue(c, ["Tỉnh", "Tinh", "T/TP"]);
      if (p) names.add(superNormalize(String(p).trim()));
    });
    return Array.from(names);
  })();

  const dictionary = categories.map((cat) => {
    const rawXa = String(
      getColumnValue(cat, ["Xã", "Tên xã", "Xa", "Tên xã/phường"]) || ""
    ).trim();
    const rawHuyen = String(
      getColumnValue(cat, [
        "Huyện",
        "Thành phố",
        "Huyen",
        "TP",
        "Huyện/Thị xã/TP",
      ]) || ""
    ).trim();
    return {
      cleanXa: rawXa ? superNormalize(removeAdminPrefix(rawXa)) : "",
      cleanHuyen: rawHuyen ? superNormalize(removeAdminPrefix(rawHuyen)) : "",
      area: getColumnValue(cat, ["Khu vực", "Vùng", "Khu vuc", "Vung"]),
      site: String(
        getColumnValue(cat, ["Mã tỉnh", "Ma tinh", "Site", "Tinh"]) || ""
      ).trim(),
    };
  });

  const contractGroups = {};
  const normExpiryKws = kwExpiryNames.map((k) => superNormalize(k));

  data.forEach((row) => {
    const cId = String(getColumnValue(row, kwContract) || "").trim();
    if (!cId) return;
    if (!contractGroups[cId])
      contractGroups[cId] = { bestRow: row, allExpiries: [] };
    Object.keys(row).forEach((key) => {
      const normKey = superNormalize(key);
      if (normExpiryKws.some((kw) => normKey.includes(kw))) {
        const ts = parseDate(row[key]);
        if (ts > 0) contractGroups[cId].allExpiries.push(ts);
      }
    });
    const currentExpiry = parseDate(getColumnValue(row, kwExpiryNames));
    const bestExpiry = parseDate(
      getColumnValue(contractGroups[cId].bestRow, kwExpiryNames)
    );
    if (currentExpiry > bestExpiry) contractGroups[cId].bestRow = row;
  });

  return Object.values(contractGroups).map((group) => {
    const row = group.bestRow;
    const rawAddr = getColumnValue(row, kwAddress) || "";
    const bestMatch = mapAddressToArea(
      rawAddr,
      dictionary,
      targetSite,
      provinceNamesNormalized
    );
    const normTail = getAddressTailForMapping(rawAddr, provinceNamesNormalized);
    const normTailVal = normTail ? superNormalize(normTail) : "";
    const displayTail = getAddressTailForDisplay(
      rawAddr,
      provinceNamesNormalized
    );

    const sortedEx = [...new Set(group.allExpiries)].sort((a, b) => b - a);
    const latestTs = sortedEx.length > 0 ? sortedEx[0] : 0;
    const prevTs = sortedEx.length > 1 ? sortedEx[1] : 0;
    const signingTs = parseDate(getColumnValue(row, kwSigning));
    const updateTsRaw = parseDate(getColumnValue(row, kwUpdate));
    const giaHanTs = parseDate(getColumnValue(row, kwGiaHan));
    const updateTs = updateTsRaw > 0 ? updateTsRaw : giaHanTs;

    let rawPhone = getColumnValue(row, kwPhone);
    // Excel/sheet_to_json thường đọc SĐT thành number → mất số 0 đầu. Nếu là number 9 chữ số thì bù lại "0".
    if (typeof rawPhone === "number" && Number.isInteger(rawPhone)) {
      const s = String(rawPhone);
      if (s.length === 9 && /^[1-9]/.test(s)) rawPhone = "0" + s;
      else rawPhone = s;
    }
    let phoneVal = String(rawPhone || "---").trim();
    const isInvalid =
      phoneVal === "---" ||
      phoneVal.length < 9 ||
      !/^[0-9+.\s]*$/.test(phoneVal);
    if (isInvalid) phoneVal = "---";

    const isGiaHan2026 =
      updateTs > 0 &&
      new Date(updateTs).getFullYear() === 2026 &&
      prevTs > 0 &&
      new Date(prevTs).getFullYear() === 2026;
    const updateMonth = updateTs > 0 ? new Date(updateTs).getMonth() + 1 : 0;
    const expiryMonth2026 =
      prevTs > 0 && new Date(prevTs).getFullYear() === 2026
        ? new Date(prevTs).getMonth() + 1
        : 0;
    const isGiaHanSom2026 =
      isGiaHan2026 &&
      updateMonth > 0 &&
      expiryMonth2026 > 0 &&
      updateMonth < expiryMonth2026;
    const isGiaHanDungHan2026 =
      isGiaHan2026 &&
      updateMonth > 0 &&
      expiryMonth2026 > 0 &&
      updateMonth === expiryMonth2026;

    return {
      ...row,
      _id: String(getColumnValue(row, kwContract) || "").trim(),
      _customer: String(getColumnValue(row, kwCustomer) || "").toUpperCase(),
      _taxId: getColumnValue(row, ["Mã số thuế", "MST"]) || "---",
      _subIdDhs:
        getColumnValue(row, ["Mã thuê bao", "Mã TB", "TB DHSXKD"]) || "---",
      _phone: phoneVal,
      _status: String(getColumnValue(row, ["Trạng thái", "Status"]) || ""),
      _signingDate: formatDateDisplay(signingTs),
      _signingTs: signingTs,
      _updateDate: formatDateDisplay(updateTs),
      _updateTs: updateTs,
      _expiryDate: formatDateDisplay(latestTs),
      _prevExpiryDate: formatDateDisplay(prevTs),
      _expiryTs: latestTs,
      _prevExpiryTs: prevTs,
      _address: rawAddr,
      _compareValue: normTailVal || "---",
      _addressSearchValue: displayTail ? String(displayTail).trim() : "---",
      _area: String(bestMatch.area || "CHƯA PHÂN LOẠI").toUpperCase(),
      _site: bestMatch.site,
      // Tổng TB hết hạn trong năm 2026 = ngày hết hạn (mới nhất) rơi vào 2026 từ 1/1/2026 (gồm cả đã gia hạn và chưa gia hạn)
      _isExpiring2026:
        latestTs > 0 &&
        new Date(latestTs).getFullYear() === 2026 &&
        latestTs >= new Date(2026, 0, 1).getTime(),
      _isPTM: signingTs > 0 && new Date(signingTs).getFullYear() === 2026,
      _isActive: latestTs >= now,
      _isGiaHan2026: isGiaHan2026,
      _isGiaHanSom2026: isGiaHanSom2026,
      _isGiaHanDungHan2026: isGiaHanDungHan2026,
      _isGiaHanTre2025:
        updateTs > 0 &&
        new Date(updateTs).getFullYear() === 2026 &&
        prevTs > 0 &&
        new Date(prevTs).getFullYear() === 2025,
    };
  });
};

/**
 * Xử lý file Home&Clinic (mẫu Home.xlsx): map khu vực từ Địa chỉ theo danh mục xã, tính toán giống Pharmacy.
 * Cột: STT, Trạng thái, Tên phòng khám, Tên khách hàng, Mã khách hàng, Email, Sđt, Gói dịch vụ,
 * Ngày đăng ký, Ngày bắt đầu, Ngày hết hạn, Địa chỉ.
 */
export function processTransactionsHomeClinic(data, categories, targetSite) {
  if (!data.length) return [];
  const now = new Date().getTime();

  const defaultProvinces = ["Long An", "Tây Ninh", "Tay Ninh"];
  const provinceNamesNormalized = (() => {
    const names = new Set(defaultProvinces.map((p) => superNormalize(p)));
    categories.forEach((c) => {
      const p = getColumnValue(c, ["Tỉnh", "Tinh", "T/TP"]);
      if (p) names.add(superNormalize(String(p).trim()));
    });
    return Array.from(names);
  })();

  const dictionary = categories.map((cat) => {
    const rawXa = String(
      getColumnValue(cat, ["Xã", "Tên xã", "Xa", "Tên xã/phường"]) || ""
    ).trim();
    const rawHuyen = String(
      getColumnValue(cat, [
        "Huyện",
        "Thành phố",
        "Huyen",
        "TP",
        "Huyện/Thị xã/TP",
      ]) || ""
    ).trim();
    return {
      cleanXa: rawXa ? superNormalize(removeAdminPrefix(rawXa)) : "",
      cleanHuyen: rawHuyen ? superNormalize(removeAdminPrefix(rawHuyen)) : "",
      area: getColumnValue(cat, ["Khu vực", "Vùng", "Khu vuc", "Vung"]),
      site: String(
        getColumnValue(cat, ["Mã tỉnh", "Ma tinh", "Site", "Tinh"]) || ""
      ).trim(),
    };
  });

  const kwId = ["Mã khách hàng", "Ma khach hang", "Mã KH"];
  const kwCustomerHome = [
    "Tên phòng khám",
    "Ten phong kham",
    "Tên khách hàng",
    "Ten khach hang",
    "Khách hàng",
  ];
  const kwAddress = ["Địa chỉ", "Dia chi", "Address"];
  const kwPhone = ["Sđt", "SDT", "SĐT", "Phone", "Điện thoại"];
  const kwExpiry = ["Ngày hết hạn", "Ngay het han", "Het han"];
  const kwSigning = [
    "Ngày đăng ký",
    "Ngay dang ky",
    "Ngày bắt đầu",
    "Ngay bat dau",
  ];
  const kwStatus = ["Trạng thái", "Trang thai", "Status"];

  return data
    .filter((row) => getColumnValue(row, kwId))
    .map((row) => {
      const rawAddr = String(getColumnValue(row, kwAddress) || "").trim();
      const bestMatch = mapAddressToArea(
        rawAddr,
        dictionary,
        targetSite,
        provinceNamesNormalized
      );
      const normTail = getAddressTailForMapping(
        rawAddr,
        provinceNamesNormalized
      );
      const normTailVal = normTail ? superNormalize(normTail) : "";
      const displayTail = getAddressTailForDisplay(
        rawAddr,
        provinceNamesNormalized
      );

      const latestTs = parseDate(getColumnValue(row, kwExpiry));
      const prevTs = 0;
      const signingTs = parseDate(getColumnValue(row, kwSigning));
      const updateTs = signingTs > 0 ? signingTs : latestTs;

      let rawPhone = getColumnValue(row, kwPhone);
      if (typeof rawPhone === "number" && Number.isInteger(rawPhone)) {
        const s = String(rawPhone);
        if (s.length === 9 && /^[1-9]/.test(s)) rawPhone = "0" + s;
        else rawPhone = s;
      }
      let phoneVal = String(rawPhone || "---").trim();
      const isInvalid =
        phoneVal === "---" ||
        phoneVal.length < 9 ||
        !/^[0-9+.\s]*$/.test(phoneVal);
      if (isInvalid) phoneVal = "---";

      const customerRaw = getColumnValue(row, kwCustomerHome) || "";
      return {
        ...row,
        _id: String(getColumnValue(row, kwId) || "").trim(),
        _customer: String(customerRaw || "").toUpperCase(),
        _taxId: getColumnValue(row, ["Email", "Email"]) || "---",
        _subIdDhs: "---",
        _phone: phoneVal,
        _status: String(getColumnValue(row, kwStatus) || ""),
        _signingDate: formatDateDisplay(signingTs),
        _signingTs: signingTs,
        _updateDate: formatDateDisplay(updateTs),
        _updateTs: updateTs,
        _expiryDate: formatDateDisplay(latestTs),
        _prevExpiryDate: formatDateDisplay(prevTs),
        _expiryTs: latestTs,
        _prevExpiryTs: prevTs,
        _address: rawAddr,
        _compareValue: normTailVal || "---",
        _addressSearchValue: displayTail ? String(displayTail).trim() : "---",
        _area: String(bestMatch.area || "CHƯA PHÂN LOẠI").toUpperCase(),
        _site: bestMatch.site,
        // Tổng TB hết hạn trong năm 2026 = ngày hết hạn (mới nhất) rơi vào 2026 từ 1/1/2026
        _isExpiring2026:
          latestTs > 0 &&
          new Date(latestTs).getFullYear() === 2026 &&
          latestTs >= new Date(2026, 0, 1).getTime(),
        _isPTM: signingTs > 0 && new Date(signingTs).getFullYear() === 2026,
        _isActive: latestTs >= now,
        _isGiaHan2026:
          updateTs > 0 &&
          new Date(updateTs).getFullYear() === 2026 &&
          prevTs > 0 &&
          new Date(prevTs).getFullYear() === 2026,
        _isGiaHanSom2026: false,
        _isGiaHanDungHan2026: false,
        _isGiaHanTre2025:
          updateTs > 0 &&
          new Date(updateTs).getFullYear() === 2026 &&
          prevTs > 0 &&
          new Date(prevTs).getFullYear() === 2025,
      };
    });
}
