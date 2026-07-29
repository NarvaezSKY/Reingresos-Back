import 'dotenv/config';
import { google } from 'googleapis';

// Configuración de credenciales
let credentials;
if (process.env.GOOGLE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_ACCOUNT_JSON);
}

// Lazy initialization del cliente de Google Sheets (reduce cold start)
let sheetsClientInstance = null;

async function getSheetsClient() {
  if (!sheetsClientInstance) {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClientInstance = google.sheets({ version: 'v4', auth });
  }
  return sheetsClientInstance;
}

// Variables de configuración
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SPREADSHEET_NAME || process.env.SHEET_NAME || 'Sheet1';

// Helpers
function rowToObj(header, row) {
  const obj = {};
  for (let i = 0; i < header.length; i++) {
    obj[header[i]] = row[i] !== undefined ? row[i] : '';
  }
  return obj;
}

function objToRow(header, obj) {
  return header.map(h => (obj[h] !== undefined ? String(obj[h]) : ''));
}

function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `R${timestamp}${random}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reintentos para fallos transitorios de Google API
const RETRYABLE_CODES = [429, 500, 502, 503, 504];
const RETRYABLE_NETWORK_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];

async function withRetry(fn, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isTransient =
        (typeof error.code === 'number' && RETRYABLE_CODES.includes(error.code)) ||
        (typeof error.code === 'string' && RETRYABLE_NETWORK_CODES.includes(error.code));
      if (!isTransient || attempt === maxRetries) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[Retry] Intento ${attempt}/${maxRetries} falló (${error.code}). Reintentando en ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw lastError;
}

// Lee el sheet completo una sola vez
async function getHeaderAndRows() {
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID not set in env');
  if (!credentials) throw new Error('GOOGLE_ACCOUNT_JSON not set in env');

  const client = await getSheetsClient();
  const res = await withRetry(() => client.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  }));
  const rows = res.data.values || [];
  const header = rows[0] || [];
  const dataRows = rows.slice(1);
  return { header, dataRows };
}

async function listItems() {
  const { header, dataRows } = await getHeaderAndRows();
  return dataRows.map(r => rowToObj(header, r));
}

async function getItemById(id) {
  const { header, dataRows } = await getHeaderAndRows();
  for (const row of dataRows) {
    const obj = rowToObj(header, row);
    if (String(obj.id) === String(id)) return obj;
  }
  return null;
}

async function createItem(item) {
  // Una sola lectura para header + validaciones + IDs existentes
  const { header, dataRows } = await getHeaderAndRows();

  // Construir sets de búsqueda con los datos ya leídos
  const existingIds = new Set();
  const existingDocs = new Set();
  for (const row of dataRows) {
    const obj = rowToObj(header, row);
    if (obj.id) existingIds.add(String(obj.id));
    if (obj.numeroDocumento) existingDocs.add(String(obj.numeroDocumento));
  }

  // Validar número de documento contra datos en memoria (sin API call extra)
  if (item.numeroDocumento) {
    if (existingDocs.has(String(item.numeroDocumento))) {
      throw new Error(`El número de documento ${item.numeroDocumento} ya existe. Use un número diferente.`);
    }
  }

  // Generar ID único contra datos en memoria (sin API call extra)
  if (!item.id) {
    let newId;
    let attempts = 0;
    do {
      newId = generateUniqueId();
      attempts++;
    } while (existingIds.has(newId) && attempts < 10);

    item.id = newId;
  } else {
    if (existingIds.has(String(item.id))) {
      throw new Error(`ID ${item.id} ya existe. Use un ID diferente o deje que se genere automáticamente.`);
    }
  }

  const row = objToRow(header, item);
  const client = await getSheetsClient();

  await withRetry(() => client.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS', // Inserta fila nueva en vez de sobrescribir
    requestBody: { values: [row] },
  }));

  return item;
}

async function findRowIndexById(id) {
  const { header, dataRows } = await getHeaderAndRows();
  for (let i = 0; i < dataRows.length; i++) {
    const obj = rowToObj(header, dataRows[i]);
    if (String(obj.id) === String(id)) return i + 2;
  }
  return -1;
}

async function updateItem(id, newData) {
  // Una sola lectura para header + búsqueda + validaciones
  const { header, dataRows } = await getHeaderAndRows();

  let rowIndex = -1;
  let existing = null;
  const existingDocs = new Set();

  for (let i = 0; i < dataRows.length; i++) {
    const obj = rowToObj(header, dataRows[i]);
    if (String(obj.id) === String(id)) {
      rowIndex = i + 2;
      existing = obj;
    }
    if (obj.numeroDocumento && String(obj.id) !== String(id)) {
      existingDocs.add(String(obj.numeroDocumento));
    }
  }

  if (rowIndex === -1) return null;

  // Validar número de documento contra datos en memoria
  if (newData.numeroDocumento && newData.numeroDocumento !== existing.numeroDocumento) {
    if (existingDocs.has(String(newData.numeroDocumento))) {
      throw new Error(`El número de documento ${newData.numeroDocumento} ya existe. Use un número diferente.`);
    }
  }

  const merged = { ...existing, ...newData, id: existing.id };
  const row = objToRow(header, merged);

  const endCol = String.fromCharCode(64 + header.length);
  const range = `${sheetName}!A${rowIndex}:${endCol}${rowIndex}`;

  const client = await getSheetsClient();
  await withRetry(() => client.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  }));

  return merged;
}

// Cache del sheetId para evitar llamadas repetidas a la metadata
let cachedSheetId = null;

async function getSheetId() {
  if (cachedSheetId) return cachedSheetId;
  const client = await getSheetsClient();
  const meta = await withRetry(() => client.spreadsheets.get({ spreadsheetId }));
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  cachedSheetId = sheet.properties.sheetId;
  return cachedSheetId;
}

async function deleteItem(id) {
  const rowIndex = await findRowIndexById(id);
  if (rowIndex === -1) return false;

  const sheetId = await getSheetId();
  const requests = [{
    deleteDimension: {
      range: {
        sheetId,
        dimension: 'ROWS',
        startIndex: rowIndex - 1,
        endIndex: rowIndex,
      },
    },
  }];

  const client = await getSheetsClient();
  await withRetry(() => client.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests },
  }));
  return true;
}

async function getStats() {
  const { header, dataRows } = await getHeaderAndRows();
  const total = dataRows.length;
  const columnas = header.length;

  const conId = dataRows.filter(row => {
    const obj = rowToObj(header, row);
    return obj.id && obj.id.trim() !== '';
  }).length;

  return {
    totalRegistros: total,
    totalColumnas: columnas,
    registrosConId: conId,
    registrosSinId: total - conId,
    columnas: header,
  };
}

export { listItems, getItemById, createItem, updateItem, deleteItem, getStats };
