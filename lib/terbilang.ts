const ONES_ID = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function threeDigitsId(n: number): string {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "Seratus" : `${ONES_ID[hundreds]} Ratus`);
  }

  if (remainder > 0) {
    if (remainder < 12) {
      parts.push(ONES_ID[remainder]);
    } else if (remainder < 20) {
      parts.push(`${ONES_ID[remainder - 10]} Belas`);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(`${ONES_ID[tens]} Puluh${ones > 0 ? ` ${ONES_ID[ones]}` : ""}`);
    }
  }

  return parts.join(" ");
}

/** Converts a non-negative integer into Indonesian words (no currency suffix). */
export function numberToWordsId(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "Nol";

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  // pad groups to align with scale labels below (billions, millions, thousands, ones)
  while (groups.length < 4) groups.unshift(0);

  const [billions, millions, thousands, ones] = groups;
  const parts: string[] = [];

  if (billions > 0) parts.push(`${threeDigitsId(billions)} Miliar`);
  if (millions > 0) parts.push(`${threeDigitsId(millions)} Juta`);
  if (thousands > 0) {
    parts.push(thousands === 1 ? "Seribu" : `${threeDigitsId(thousands)} Ribu`);
  }
  if (ones > 0) parts.push(threeDigitsId(ones));

  return parts.join(" ");
}

const ONES_EN = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS_EN = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function threeDigitsEn(n: number): string {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) parts.push(`${ONES_EN[hundreds]} Hundred`);

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES_EN[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(`${TENS_EN[tens]}${ones > 0 ? ` ${ONES_EN[ones]}` : ""}`);
    }
  }

  return parts.join(" ");
}

/** Converts a non-negative integer into English words (no currency suffix). */
export function numberToWordsEn(value: number): string {
  const n = Math.round(Math.abs(value));
  if (n === 0) return "Zero";

  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.unshift(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  while (groups.length < 4) groups.unshift(0);

  const [billions, millions, thousands, ones] = groups;
  const parts: string[] = [];

  if (billions > 0) parts.push(`${threeDigitsEn(billions)} Billion`);
  if (millions > 0) parts.push(`${threeDigitsEn(millions)} Million`);
  if (thousands > 0) parts.push(`${threeDigitsEn(thousands)} Thousand`);
  if (ones > 0) parts.push(threeDigitsEn(ones));

  return parts.join(" ");
}

/**
 * e.g. terbilang(23750000, "id") -> "Dua Puluh Tiga Juta Tujuh Ratus Lima Puluh Ribu Rupiah"
 *      terbilang(23750000, "en") -> "Twenty Three Million Seven Hundred Fifty Thousand Rupiah"
 */
export function terbilang(value: number | string, language: "id" | "en" = "id"): string {
  const n = typeof value === "string" ? Number(value) : value;
  const words = language === "en" ? numberToWordsEn(n) : numberToWordsId(n);
  return `${words} Rupiah`;
}
