import fs from 'node:fs';

const appPath = new URL('../App.tsx', import.meta.url);
const adminApiPath = new URL('../lib/adminApi.ts', import.meta.url);
const source = fs.readFileSync(appPath, 'utf8');
const adminApiSource = fs.readFileSync(adminApiPath, 'utf8');

const supplierRedirectMatch = source.match(/host\.startsWith\("supplier\."\) && pathname !== "\/supplier" && pathname !== "\/supplier-login"\) \{\s*window\.location\.replace\(`\/([^$]+)\$\{search\}`\);/s);
const supplierRouteMatch = source.match(/<Route path="\/supplier-login" element=\{<SupplierLogin \/>\} \/>/);
const adminRedirectMatch = source.match(/host\.startsWith\("admin\."\) && pathname !== "\/admin" && pathname !== "\/admin-login"\) \{\s*window\.location\.replace\(`\/([^$]+)\$\{search\}`\);/s);
const adminLoginRouteMatch = source.match(/<Route path="\/admin-login" element=\{<AdminLogin \/>\} \/>/);
const adminApiRedirectMatch = adminApiSource.match(/window\.location\.href = '([^']+)'/);

if (!supplierRouteMatch) {
  throw new Error('Supplier login route `/supplier-login` is missing from App routes.');
}

if (!adminLoginRouteMatch) {
  throw new Error('Admin login route `/admin-login` is missing from App routes.');
}

if (!supplierRedirectMatch) {
  throw new Error('Supplier subdomain redirect block was not found in App.tsx.');
}

if (!adminRedirectMatch) {
  throw new Error('Admin subdomain redirect block was not found in App.tsx.');
}

if (!adminApiRedirectMatch) {
  throw new Error('Admin API unauthorized redirect path was not found in adminApi.ts.');
}

const redirectPath = supplierRedirectMatch[1];
const adminRedirectPath = adminRedirectMatch[1];
const adminApiRedirectPath = adminApiRedirectMatch[1];

if (redirectPath !== 'supplier-login') {
  throw new Error(`Supplier subdomain redirect points to /${redirectPath} but expected /supplier-login.`);
}

if (adminRedirectPath !== 'admin') {
  throw new Error(`Admin subdomain redirect points to /${adminRedirectPath} but expected /admin.`);
}

if (adminApiRedirectPath !== '/admin-login?reason=session_expired') {
  throw new Error(`Admin API redirect points to ${adminApiRedirectPath} but expected /admin-login?reason=session_expired.`);
}

if (source.includes('/#/') || adminApiSource.includes('/#/admin-login')) {
  throw new Error('Hash-based admin/supplier redirects were found, but app uses BrowserRouter paths.');
}

console.log('Admin/Supplier redirect consistency check passed.');