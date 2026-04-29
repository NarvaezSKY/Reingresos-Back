import 'dotenv/config';
import { google } from 'googleapis';

// Configuración de credenciales
let credentials;
if (process.env.GOOGLE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_ACCOUNT_JSON);
}

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const googleSheetsClient = google.sheets({ version: 'v4', auth });

// Variables de configuración
const spreadsheetId = process.env.SPREADSHEET_ID;
const sheetName = process.env.SPREADSHEET_NAME || process.env.SHEET_NAME || 'Sheet1';

async function getHeaderAndRows() {
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID not set in env');
  if (!credentials) throw new Error('GOOGLE_ACCOUNT_JSON not set in env');
  
  const res = await googleSheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });
  const rows = res.data.values || [];
  const header = rows[0] || [];
  const dataRows = rows.slice(1);
  return { header, dataRows };
}

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

// Función para generar ID único
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `R${timestamp}${random}`; // Formato: R1699123456789123
}

// Función para verificar si un ID ya existe
async function idExists(id) {
  const item = await getItemById(id);
  return item !== null;
}

// Función para verificar si un número de documento ya existe
async function documentNumberExists(numeroDocumento) {
  const { header, dataRows } = await getHeaderAndRows();
  for (const row of dataRows) {
    const obj = rowToObj(header, row);
    if (String(obj.numeroDocumento) === String(numeroDocumento)) {
      return true;
    }
  }
  return false;
}

async function createItem(item) {
  const { header } = await getHeaderAndRows();
  
  // Verificar que el número de documento no exista (si se proporciona)
  if (item.numeroDocumento) {
    if (await documentNumberExists(item.numeroDocumento)) {
      throw new Error(`El número de documento ${item.numeroDocumento} ya existe. Use un número diferente.`);
    }
  }
  
  // Generar ID único si no se proporciona
  if (!item.id) {
    let newId;
    let attempts = 0;
    do {
      newId = generateUniqueId();
      attempts++;
    } while (await idExists(newId) && attempts < 10); // Máximo 10 intentos
    
    item.id = newId;
  } else {
    // Verificar que el ID proporcionado no exista
    if (await idExists(item.id)) {
      throw new Error(`ID ${item.id} ya existe. Use un ID diferente o deje que se genere automáticamente.`);
    }
  }
  
  const row = objToRow(header, item);
  
  await googleSheetsClient.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
  return item;
}

async function findRowIndexById(id) {
  const { header, dataRows } = await getHeaderAndRows();
  for (let i = 0; i < dataRows.length; i++) {
    const obj = rowToObj(header, dataRows[i]);
    if (String(obj.id) === String(id)) return i + 2; // 1-based, +1 for header
  }
  return -1;
}

async function updateItem(id, newData) {
  const { header } = await getHeaderAndRows();
  const rowIndex = await findRowIndexById(id);
  if (rowIndex === -1) return null;
  const existing = await getItemById(id);
  
  // Verificar número de documento si se está actualizando
  if (newData.numeroDocumento && newData.numeroDocumento !== existing.numeroDocumento) {
    if (await documentNumberExists(newData.numeroDocumento)) {
      throw new Error(`El número de documento ${newData.numeroDocumento} ya existe. Use un número diferente.`);
    }
  }
  
  const merged = { ...existing, ...newData, id: existing.id };
  const row = objToRow(header, merged);
  
  const endCol = String.fromCharCode(64 + header.length); // naive for <=26 cols
  const range = `${sheetName}!A${rowIndex}:${endCol}${rowIndex}`;
  
  await googleSheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
  return merged;
}

async function getSheetId() {
  const meta = await googleSheetsClient.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  return sheet.properties.sheetId;
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
        endIndex: rowIndex
      }
    }
  }];
  
  await googleSheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests }
  });
  return true;
}

// Función para obtener estadísticas del sheet
async function getStats() {
  const { header, dataRows } = await getHeaderAndRows();
  const total = dataRows.length;
  const columnas = header.length;
  
  // Contar registros con ID
  const conId = dataRows.filter(row => {
    const obj = rowToObj(header, row);
    return obj.id && obj.id.trim() !== '';
  }).length;
  
  return {
    totalRegistros: total,
    totalColumnas: columnas,
    registrosConId: conId,
    registrosSinId: total - conId,
    columnas: header
  };
}

export { listItems, getItemById, createItem, updateItem, deleteItem, getStats };