import ExcelJS from 'exceljs';
import AppError from '../utils/AppError';

export interface SheetColumn {
  header: string;
  width?: number;
  list?: string[]; // Si existe, la columna lleva lista desplegable con estos valores.
}

export interface SheetDefinition {
  name: string;
  columns: SheetColumn[];
}

export interface SheetRow {
  row: number; // Número de fila en Excel (≥ 2).
  cells: Record<string, string>; // Clave: encabezado esperado.
}

const LISTS_SHEET_NAME = 'Listas';
const VALIDATION_LAST_ROW = 1001;
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

// Cada lista va en su propia columna de la hoja oculta `Listas`: el rango evita el límite
// de 255 caracteres de las listas inline.
export async function buildWorkbook(sheet: SheetDefinition): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheet.name, { views: [{ state: 'frozen', ySplit: 1 }] });
  const listsSheet = workbook.addWorksheet(LISTS_SHEET_NAME, { state: 'hidden' });

  worksheet.columns = sheet.columns.map((c) => ({ header: c.header, width: c.width ?? 22 }));
  worksheet.getRow(1).font = { bold: true };

  sheet.columns.forEach((column, index) => {
    if (!column.list?.length) return;

    const listColumn = listsSheet.getColumn(index + 1);
    column.list.forEach((value, i) => {
      listsSheet.getCell(i + 1, listColumn.number).value = value;
    });

    const letter = listColumn.letter;
    const range = `${LISTS_SHEET_NAME}!$${letter}$1:$${letter}$${column.list.length}`;
    for (let row = 2; row <= VALIDATION_LAST_ROW; row++) {
      worksheet.getCell(row, index + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [range],
        showErrorMessage: true,
        errorTitle: 'Valor no permitido',
        error: 'Selecciona un valor de la lista.',
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('').trim();
    if ('result' in value) return cellToString(value.result as ExcelJS.CellValue);
    if ('text' in value) return String(value.text).trim();
    if ('error' in value) return '';
  }
  return '';
}

// Lee la primera hoja. Rechaza (422) lo que no sea un .xlsx o cuyos encabezados no
// coincidan con los esperados; omite las filas totalmente vacías.
export async function readSheetRows(
  buffer: Buffer,
  expectedHeaders: string[],
  headersMismatchMessage: string
): Promise<SheetRow[]> {
  const isZip = ZIP_SIGNATURE.every((byte, i) => buffer[i] === byte);
  if (!isZip) {
    throw new AppError('El archivo debe ser una hoja de cálculo .xlsx.', 422);
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new AppError('El archivo debe ser una hoja de cálculo .xlsx.', 422);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new AppError('El archivo debe ser una hoja de cálculo .xlsx.', 422);
  }

  const headerRow = worksheet.getRow(1);
  const totalColumns = Math.max(worksheet.columnCount, expectedHeaders.length);
  const headersMatch = Array.from({ length: totalColumns }, (_, i) => {
    const actual = normalizeHeader(cellToString(headerRow.getCell(i + 1).value));
    const expected = expectedHeaders[i];
    return expected === undefined ? actual === '' : actual === normalizeHeader(expected);
  }).every(Boolean);
  if (!headersMatch) {
    throw new AppError(headersMismatchMessage, 422);
  }

  const rows: SheetRow[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const excelRow = worksheet.getRow(rowNumber);
    const cells: Record<string, string> = {};
    expectedHeaders.forEach((header, i) => {
      cells[header] = cellToString(excelRow.getCell(i + 1).value);
    });
    if (Object.values(cells).every((v) => v === '')) continue;
    rows.push({ row: rowNumber, cells });
  }
  return rows;
}
