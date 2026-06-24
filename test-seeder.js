import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log("Memulai validasi sintaksis migrate.js...");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migratePath = path.join(__dirname, 'src', 'migrate.js');
if (!fs.existsSync(migratePath)) {
  console.error("Error: src/migrate.js tidak ditemukan!");
  process.exit(1);
}

const content = fs.readFileSync(migratePath, 'utf8');

// Regex untuk mengekstrak string JSONB (mendukung array [] dan objek {})
const jsonbRegex = /'((?:\[|\{)(?:[^']|'')*?(?:\]|\}))'::jsonb/g;
let match;
let count = 0;
let hasError = false;

const getLineNumber = (content, index) => content.substring(0, index).split('\n').length;

while ((match = jsonbRegex.exec(content)) !== null) {
  count++;
  const rawJson = match[1];
  const line = getLineNumber(content, match.index);
  
  // Deteksi escape single-backslash (seharusnya double-backslash \\ di file mentah)
  const singleBackslashCheck = rawJson.replace(/\\\\/g, '');
  if (singleBackslashCheck.includes('\\')) {
    hasError = true;
    console.error(`[FAIL] Line ${line}: Payload #${count} memiliki unescaped single-backslash!`);
    console.error("Detail: Setiap backslash dalam template literal harus di-escape ganda (misal: \\\\n, \\\\t, \\\\\")");
    continue;
  }

  // Perbaiki escaping double single quote yang biasa di SQL ('' -> ')
  let jsonStr = rawJson.replace(/''/g, "'");
  
  try {
    const parsed = JSON.parse(jsonStr);
    const type = Array.isArray(parsed) ? (parsed[0]?.type || 'array') : 'object';
    console.log(`[PASS] Line ${line}: Payload #${count} berhasil diparsing. Tipe: ${type}`);
  } catch (err) {
    hasError = true;
    console.error(`[FAIL] Line ${line}: Payload #${count} gagal diparsing!`);
    console.error("String JSON bermasalah:");
    console.error(jsonStr.substring(0, 200) + "...");
    console.error("Error detail:", err.message);
  }
}

if (hasError) {
  console.error("\nValidasi GAGAL! Ada payload JSONB yang tidak valid.");
  process.exit(1);
} else {
  console.log(`\nValidasi SUKSES! ${count} payload JSONB valid.`);
}
