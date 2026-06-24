import fs from 'fs';
import path from 'path';

console.log("Memulai validasi sintaksis migrate.js...");

const migratePath = path.join(process.cwd(), 'src', 'migrate.js');
if (!fs.existsSync(migratePath)) {
  console.error("Error: src/migrate.js tidak ditemukan!");
  process.exit(1);
}

const content = fs.readFileSync(migratePath, 'utf8');

// Regex sederhana untuk mengekstrak string JSONB
// Kita cari pola yang diakhiri dengan '::jsonb'
const jsonbRegex = /'(\[(?:[^']|'')*?\])'::jsonb/g;
let match;
let count = 0;
let hasError = false;

while ((match = jsonbRegex.exec(content)) !== null) {
  count++;
  let jsonStr = match[1];
  
  // Perbaiki escaping double single quote yang biasa di SQL ('' -> ')
  jsonStr = jsonStr.replace(/''/g, "'");
  
  try {
    const parsed = JSON.parse(jsonStr);
    console.log(`[PASS] Payload #${count} berhasil diparsing. Tipe: ${parsed[0]?.type || 'unknown'}`);
  } catch (err) {
    hasError = true;
    console.error(`[FAIL] Payload #${count} gagal diparsing!`);
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
