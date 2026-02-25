const TOKEN_KEY = "supplierToken";
const ADMIN_TOKEN_KEY = "adminToken";

export function setSupplierToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getSupplierToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function clearSupplierToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
