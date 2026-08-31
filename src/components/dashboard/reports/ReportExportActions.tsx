import React, { useState } from 'react';
import { Download, Printer, Check } from 'lucide-react';

interface ReportExportActionsProps {
  onExportCSV: () => void;
  onPrint?: () => void;
  recordCount: number;
  idPrefix: string;
  csvLabel?: string;
  printLabel?: string;
}

export const ReportExportActions: React.FC<ReportExportActionsProps> = ({
  onExportCSV,
  onPrint,
  recordCount,
  idPrefix,
  csvLabel = 'Export CSV',
  printLabel = 'Print Report',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportClick = () => {
    if (recordCount === 0 || isExporting) return;
    setIsExporting(true);
    try {
      onExportCSV();
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setIsExporting(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setIsExporting(false);
    }
  };

  const handlePrintClick = () => {
    if (recordCount === 0) return;
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const isDisabled = recordCount === 0;

  return (
    <div className="flex items-center gap-2 no-print">
      {/* Export CSV Button */}
      <button
        id={`${idPrefix}-export-csv-btn`}
        type="button"
        onClick={handleExportClick}
        disabled={isDisabled || isExporting}
        title={
          isDisabled
            ? 'No records to export'
            : `Export ${recordCount} filtered records to CSV`
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
          exportSuccess
            ? 'bg-emerald-600 text-white'
            : isDisabled
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-98'
        }`}
      >
        {exportSuccess ? (
          <Check className="w-3.5 h-3.5 text-emerald-100 animate-in fade-in" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{exportSuccess ? 'Downloaded!' : csvLabel}</span>
      </button>

      {/* Print Button */}
      <button
        id={`${idPrefix}-print-btn`}
        type="button"
        onClick={handlePrintClick}
        disabled={isDisabled}
        title={
          isDisabled
            ? 'No records to print'
            : `Print official report of ${recordCount} records`
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
          isDisabled
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <Printer className="w-3.5 h-3.5 text-slate-500" />
        <span>{printLabel}</span>
      </button>
    </div>
  );
};
