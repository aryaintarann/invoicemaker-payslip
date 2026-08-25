export class PdfServiceUnavailableError extends Error {}
export class PdfConversionError extends Error {}

/**
 * Converts a filled .docx/.xlsx buffer to PDF via a Gotenberg instance
 * (LibreOffice route). See ARCHITECTURE.md — this keeps the app deployable
 * on Vercel by delegating the actual conversion to a small external service
 * instead of running LibreOffice in the serverless function.
 */
export async function convertToPdf(buffer: Buffer, filename: string): Promise<Buffer> {
  const baseUrl = process.env.GOTENBERG_URL;
  if (!baseUrl) {
    throw new PdfServiceUnavailableError(
      "GOTENBERG_URL belum diatur. Set env var ini ke URL service Gotenberg Anda untuk mengaktifkan download PDF."
    );
  }

  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(buffer)]), filename);

  let res: Response;
  try {
    res = await fetch(new URL("/forms/libreoffice/convert", baseUrl), {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(55_000),
    });
  } catch (error) {
    throw new PdfServiceUnavailableError(
      `Tidak bisa menghubungi service konversi PDF (${(error as Error).message}). ` +
        "Jika service sedang tidur (cold start), coba lagi dalam beberapa puluh detik."
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PdfConversionError(`Konversi PDF gagal (${res.status}): ${body.slice(0, 300)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
