
export function parseFilenameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) return null;

  // filename*=UTF-8''... (RFC 5987)
  const starMatch = headerValue.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (starMatch?.[1]) {
    try {
      return decodeURIComponent(starMatch[1].trim());
    } catch {
      // ignore decode errors
    }
  }

  // filename="..."
  const quotedMatch = headerValue.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1].trim();

  // filename=...
  const plainMatch = headerValue.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch?.[1]) return plainMatch[1].trim();

  return null;
}
