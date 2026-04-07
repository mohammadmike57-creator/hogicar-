import fs from 'node:fs';

const appPath = new URL('../App.tsx', import.meta.url);
const source = fs.readFileSync(appPath, 'utf8');

const supplierRedirectMatch = source.match(/supplier\."\) && !hash\.startsWith\("#\/supplier"\)\) \{\s*window\.location\.replace\(`\/#\/([^$]+)\$\{search\}`\);/s);
const supplierRouteMatch = source.match(/<Route path="\/supplier-login" element=\{<SupplierLogin \/>\} \/>/);

if (!supplierRouteMatch) {
  throw new Error('Supplier login route `/supplier-login` is missing from App routes.');
}

if (!supplierRedirectMatch) {
  throw new Error('Supplier subdomain redirect block was not found in App.tsx.');
}

const redirectPath = supplierRedirectMatch[1];

if (redirectPath !== 'supplier-login') {
  throw new Error(`Supplier subdomain redirect points to /${redirectPath} but expected /supplier-login.`);
}

console.log('Supplier redirect consistency check passed.');