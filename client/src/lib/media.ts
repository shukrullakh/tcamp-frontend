export const API_BASE =
  "https://cradling-boogieman-hug.ngrok-free.dev";

export function getMediaUrl(url?: string | null): string {
  if (!url) return "/default-avatar.png";

  // full URL bo‘lsa
  if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);

      // localhost bo‘lsa backend domainiga almashtiramiz
      if (
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "localhost" ||
        parsed.hostname.startsWith("172.") 
      ) {
        return `${API_BASE}${parsed.pathname}`;
      }

      return parsed.toString();
    } catch {
      return "/default-avatar.png";
    }
  }

  // relative media path
  if (url.startsWith("/")) {
    return `${API_BASE}${url}`;
  }

  return `${API_BASE}/media/${url}`;
}

export function getImageFallback(): string {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="48" fill="%23999" text-anchor="middle" dy=".3em"%3EU%3C/text%3E%3C/svg%3E';
}