/**
 * Fetches a file-download endpoint and saves the response as a file. Unlike a
 * plain `<a href>`, this surfaces JSON `{ error }` bodies (e.g. Gotenberg down,
 * GOTENBERG_URL unset) as a thrown Error instead of navigating the browser to
 * an error page. Client-only (uses DOM).
 */
export async function downloadViaFetch(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res
      .json()
      .then((b) => (b as { error?: string }).error)
      .catch(() => null);
    throw new Error(msg || `Download gagal (${res.status}).`);
  }

  const blob = await res.blob();
  const name =
    /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
