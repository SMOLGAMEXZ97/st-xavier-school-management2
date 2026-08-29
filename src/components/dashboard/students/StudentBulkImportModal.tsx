import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  adminBackendService,
  BulkProvisionStudentInput,
  BulkProvisionResponse,
  NetlifyBackendError,
} from '../../../services/adminBackendService';
import { parseDateParts, formatDateToDisplay } from '../../../utils/dateUtils';

interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentBulkImportModal: React.FC<StudentBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<BulkProvisionStudentInput[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<BulkProvisionResponse | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      'Admission Number,First Name,Last Name,Date of Birth (DD/MM/YYYY),Class,Section,Roll Number,Academic Year,Guardian Name,Guardian Phone,Guardian Relationship,Address\n' +
      'ADM-2026-001,Aarav,Patra,12/04/2015,Class 5,A,01,2026-2027,Rajesh Patra,9876543210,Father,Tihidi Bazar, Bhadrak\n' +
      'ADM-2026-002,Priya,Mohanty,23/08/2015,Class 5,A,02,2026-2027,Subhas Mohanty,9876543211,Father,Pirahat, Tihidi\n' +
      'ADM-2026-003,Rohan,Nayak,05/11/2014,Class 6,B,01,2026-2027,Manorama Nayak,9876543212,Mother,Barapur Road, Tihidi';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'st_xavier_student_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.txt')) {
      setParseErrors(['Please select a valid CSV (.csv) file.']);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setParseErrors(['File size exceeds 5MB limit. Please upload smaller batches.']);
      return;
    }

    setFile(selected);
    setParseErrors([]);
    setImportResult(null);
    setBackendError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selected);
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      setParseErrors(['The CSV file must contain a header row and at least one student data row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const rows: BulkProvisionStudentInput[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowParts = lines[i].split(',').map((p) => p.trim());
      if (rowParts.length < 5) {
        errors.push(`Row ${i + 1}: Malformed row or insufficient columns.`);
        continue;
      }

      // Map columns flexibly
      const adm = rowParts[0];
      const fn = rowParts[1];
      const ln = rowParts[2];
      const dob = rowParts[3];
      const cls = rowParts[4];
      const sec = rowParts[5] || 'A';
      const roll = rowParts[6] || `${i}`;
      const year = rowParts[7] || '2026-2027';
      const guardian = rowParts[8] || 'Parent / Guardian';
      const phone = rowParts[9] || 'N/A';
      const rel = rowParts[10] || 'Guardian';
      const addr = rowParts[11] || 'Tihidi, Bhadrak';

      if (!adm || !fn || !ln || !dob || !cls) {
        errors.push(`Row ${i + 1}: Missing required fields (Admission No, Name, DOB, or Class).`);
        continue;
      }

      const parsedDobParts = parseDateParts(dob);
      if (!parsedDobParts || !parsedDobParts.isValid) {
        errors.push(`Row ${i + 1} (${adm}): Invalid date of birth (${dob}). Use DD/MM/YYYY or YYYY-MM-DD.`);
        continue;
      }

      const dayStr = String(parsedDobParts.day).padStart(2, '0');
      const monthStr = String(parsedDobParts.month).padStart(2, '0');
      const normalizedDob = `${parsedDobParts.year}-${monthStr}-${dayStr}`;

      rows.push({
        admissionNumber: adm.toUpperCase(),
        firstName: fn,
        lastName: ln,
        dateOfBirth: normalizedDob,
        className: cls,
        section: sec.toUpperCase(),
        rollNumber: roll,
        academicYear: year,
        guardianName: guardian,
        guardianPhone: phone,
        guardianRelationship: rel,
        address: addr,
      });
    }

    if (rows.length > 100) {
      errors.push(`Batch contains ${rows.length} records. Maximum limit per import batch is 100 students for memory safety.`);
    }

    setParsedRows(rows.slice(0, 100));
    setParseErrors(errors);
  };

  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setBackendError(null);
    setImportResult(null);

    try {
      const result = await adminBackendService.bulkProvisionStudents({
        students: parsedRows,
      });
      setImportResult(result);
      if (result.summary.successful > 0) {
        onSuccess();
      }
    } catch (err: any) {
      if (err instanceof NetlifyBackendError) {
        setBackendError(err.message);
      } else {
        setBackendError(err?.message || 'Bulk student account provisioning failed.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-900">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Bulk Student Import & Account Provisioning
              </h2>
              <p className="text-xs text-slate-500">
                Import multiple enrolled students and batch-provision Firebase Authentication credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Template Download Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50/70 border border-blue-200 rounded-xl gap-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">CSV Template Available</h4>
                <p className="text-xs text-blue-800/90 mt-0.5">
                  Download the official student import spreadsheet structure with required headers and formatting.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-900 hover:bg-blue-100 text-xs font-medium rounded-lg border border-blue-300 shadow-xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Template (.CSV)
            </button>
          </div>

          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt"
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Click to select or drop CSV student data file'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports .CSV files up to 100 rows per batch. Memory safeguarded.
            </p>
          </div>

          {/* Validation Warnings */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                Validation Warnings ({parseErrors.length})
              </div>
              <ul className="list-disc list-inside text-amber-800 space-y-0.5 max-h-32 overflow-y-auto pl-1">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Backend / Network Error */}
          {backendError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                Provisioning Service Notice
              </div>
              <p className="text-rose-800">{backendError}</p>
            </div>
          )}

          {/* Import Result Summary */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                Bulk Provisioning Report
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 text-center font-medium">
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="block text-slate-500 text-[10px] uppercase">Total</span>
                  <span className="text-sm font-bold text-slate-800">{importResult.summary.totalRows}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="block text-emerald-600 text-[10px] uppercase">Successful</span>
                  <span className="text-sm font-bold text-emerald-700">{importResult.summary.successful}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="block text-rose-600 text-[10px] uppercase">Failed</span>
                  <span className="text-sm font-bold text-rose-700">{importResult.summary.failed}</span>
                </div>
              </div>
              {importResult.validationErrors.length > 0 && (
                <div className="mt-2 text-rose-800 text-[11px] max-h-24 overflow-y-auto">
                  <p className="font-semibold mb-1">Issue Details:</p>
                  {importResult.validationErrors.map((ve, idx) => (
                    <p key={idx}>• {ve.admissionNumber ? `[${ve.admissionNumber}] ` : ''}{ve.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Preview Ready Records ({parsedRows.length} students)</span>
                <span className="text-emerald-700 font-medium">Validation Passed</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">Adm No</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Class</th>
                      <th className="p-2">DOB</th>
                      <th className="p-2">Roll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-blue-900">{r.admissionNumber}</td>
                        <td className="p-2 font-sans">{r.firstName} {r.lastName}</td>
                        <td className="p-2 font-sans">{r.className} - {r.section}</td>
                        <td className="p-2">{formatDateToDisplay(r.dateOfBirth)}</td>
                        <td className="p-2">{r.rollNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {importResult ? 'Close Window' : 'Cancel'}
          </button>
          {!importResult && (
            <button
              type="button"
              disabled={parsedRows.length === 0 || isProcessing}
              onClick={handleStartImport}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Provisioning Batch...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Import & Provision ({parsedRows.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
