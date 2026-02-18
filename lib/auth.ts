const TOKEN_KEY = "supplierToken";

export function setSupplierToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getSupplierToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function clearSupplierToken() {
  localStorage.removeItem(TOKEN_KEY);
}
