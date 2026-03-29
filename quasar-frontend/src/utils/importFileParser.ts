import type { ImportPreviewData } from '../types/import';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

export async function parseImportFile(file: File): Promise<ImportPreviewData> {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return {
      fileHeaders: [],
      filePreviewData: [],
      totalRows: 0,
    };
  }

  return {
    fileHeaders: parseCsvLine(lines[0] || ''),
    filePreviewData: lines.slice(1, 6).map((line) => parseCsvLine(line)),
    totalRows: Math.max(lines.length - 1, 0),
  };
}
