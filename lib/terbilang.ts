const ONES = [
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

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "Seratus" : `${ONES[hundreds]} Ratus`);
  }

  if (remainder > 0) {
    if (remainder < 12) {
      parts.push(ONES[remainder]);
    } else if (remainder < 20) {
      parts.push(`${ONES[remainder - 10]} Belas`);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(`${ONES[tens]} Puluh${ones > 0 ? ` ${ONES[ones]}` : ""}`);
    }
  }

  return parts.join(" ");
}

/** Converts a non-negative integer into Indonesian words (no currency suffix). */
export function numberToWords(value: number): string {
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

  if (billions > 0) parts.push(`${threeDigits(billions)} Miliar`);
  if (millions > 0) parts.push(`${threeDigits(millions)} Juta`);
  if (thousands > 0) {
    parts.push(thousands === 1 ? "Seribu" : `${threeDigits(thousands)} Ribu`);
  }
  if (ones > 0) parts.push(threeDigits(ones));

  return parts.join(" ");
}

/** e.g. terbilang(23750000) -> "Dua Puluh Tiga Juta Tujuh Ratus Lima Puluh Ribu Rupiah" */
export function terbilang(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${numberToWords(n)} Rupiah`;
}
