export class WhatsAppNotifyError extends Error {}

/**
 * Sends a WhatsApp message via a self-hosted Evolution API instance
 * (https://doc.evolution-api.com/). Unlike CallMeBot this can message any
 * number the connected instance is allowed to reach, but we still only ping
 * the admin's own number (EVOLUTION_TARGET_NUMBER) for overdue-invoice alerts.
 */
export async function sendWhatsAppNotification(text: string): Promise<void> {
  const base = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const number = process.env.EVOLUTION_TARGET_NUMBER;
  if (!base || !apiKey || !instance || !number) {
    throw new WhatsAppNotifyError(
      "EVOLUTION_API_URL / EVOLUTION_API_KEY / EVOLUTION_INSTANCE / EVOLUTION_TARGET_NUMBER belum diatur."
    );
  }

  const url = `${base.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(instance)}`;

  let res: Response;
  let body: string;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({ number, text }),
      signal: AbortSignal.timeout(15_000),
    });
    body = await res.text();
  } catch (error) {
    throw new WhatsAppNotifyError(
      `Tidak bisa menghubungi Evolution API: ${(error as Error).message}`
    );
  }

  if (!res.ok) {
    throw new WhatsAppNotifyError(`Evolution API gagal mengirim pesan: ${body.slice(0, 300)}`);
  }
}
