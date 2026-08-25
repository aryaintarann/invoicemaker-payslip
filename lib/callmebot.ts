export class WhatsAppNotifyError extends Error {}

/**
 * Sends a WhatsApp message to the admin's own number via CallMeBot's free
 * API. CallMeBot requires the *recipient* number to opt in once (message the
 * CallMeBot bot to get an apiKey) - it's meant for notifying yourself, not
 * arbitrary client numbers that haven't gone through that flow.
 */
export async function sendWhatsAppNotification(text: string): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) {
    throw new WhatsAppNotifyError("CALLMEBOT_PHONE / CALLMEBOT_APIKEY belum diatur.");
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apiKey);

  let res: Response;
  let body: string;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    body = await res.text();
  } catch (error) {
    throw new WhatsAppNotifyError(
      `Tidak bisa menghubungi CallMeBot: ${(error as Error).message}`
    );
  }

  // CallMeBot returns HTTP 200 even on failure (invalid apikey, phone not
  // registered, rate limited, ...) - it only signals errors via body text.
  if (!res.ok || /error/i.test(body)) {
    throw new WhatsAppNotifyError(`CallMeBot gagal mengirim pesan: ${body.slice(0, 300)}`);
  }
}
