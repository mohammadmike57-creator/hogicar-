
import { getSupplierToken } from "./auth";
import { getApiBaseUrl } from "./apiBase";

function getFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const utf8 = cd.match(/filename\*s*=\s*UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const normal = cd.match(/filename\s*=\s*"([^"]+)"/i) || cd.match(/filename\s*=\s*([^;]+)/i);
  if (normal?.[1]) return normal[1].trim();
  return null;
}

export async function downloadRatesTemplateExcel() {
  const token = getSupplierToken();
  if (!token) throw new Error("You are not logged in. Missing token.");

  const base = getApiBaseUrl();
  const url = `${base}/api/supplier/rates/template`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e: any) {
    throw new Error(`Network/CORS error while downloading template: ${e?.message || String(e)}`);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}. ${txt}`);
  }

  const cd = res.headers.get("Content-Disposition");
  const filename = getFilenameFromContentDisposition(cd) || "Supplier_Rates_Template.xlsx";

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}
