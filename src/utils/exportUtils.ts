/**
 * Utility functions for exporting tabular reports to CSV format and handling download actions.
 */

export function exportToCSV(
  baseFilename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  dateSuffix?: string
): void {
  const escapeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    // Protect against CSV formula injection (RFC 4180 / OWASP)
    if (/^[=+@-]/.test(str)) {
      str = `'${str}`;
    }
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const csvLines: string[] = [];
  
  // Header row
  csvLines.push(headers.map(escapeCell).join(','));

  // Data rows
  rows.forEach((row) => {
    csvLines.push(row.map(escapeCell).join(','));
  });

  const csvContent = '\uFEFF' + csvLines.join('\r\n'); // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const cleanName = baseFilename.replace(/\.csv$/i, '');
  const suffix = dateSuffix ? `${dateSuffix}` : `-${today}`;
  const downloadName = `${cleanName}${suffix}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', downloadName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatReportCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export function formatReportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
