import React from 'react';
import { SchoolLogo } from '../../SchoolLogo';

export interface SummaryMetricItem {
  label: string;
  value: string | number;
}

interface ReportPrintHeaderProps {
  reportTitle: string;
  academicSession?: string;
  appliedFiltersSummary?: string[];
  summaryMetrics?: SummaryMetricItem[];
}

export const ReportPrintHeader: React.FC<ReportPrintHeaderProps> = ({
  reportTitle,
  academicSession,
  appliedFiltersSummary = [],
  summaryMetrics = [],
}) => {
  const currentFormattedDateTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
      {/* School Official Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-300">
        <div className="flex items-center gap-3">
          <SchoolLogo size="sm" />
          <div>
            <h1 className="text-xl font-bold font-serif tracking-tight text-slate-900 uppercase">
              St. Xavier High School
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-slate-700 uppercase">
              Tihidi, Bhadrak, Odisha • Affiliated to CBSE, New Delhi
            </p>
            <p className="text-[9px] text-slate-500">
              Co-Educational Senior Secondary Institution • Official Records Repository
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-600">
          <div><strong className="text-slate-800">Generated:</strong> {currentFormattedDateTime}</div>
          <div><strong className="text-slate-800">System:</strong> Administrative Console</div>
          <div><strong className="text-slate-800">Status:</strong> Verified Official Extract</div>
        </div>
      </div>

      {/* Report Title & Metadata Banner */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            {reportTitle}
          </h2>
          {academicSession && (
            <p className="text-xs text-slate-700 font-semibold mt-0.5">
              Academic Session: <span className="text-blue-900">{academicSession}</span>
            </p>
          )}
        </div>

        {appliedFiltersSummary.length > 0 && (
          <div className="text-[10px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
            <span className="font-semibold text-slate-800">Filters: </span>
            {appliedFiltersSummary.join(' | ')}
          </div>
        )}
      </div>

      {/* Summary KPI Pills for Print */}
      {summaryMetrics.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2 border-t border-slate-200">
          {summaryMetrics.map((metric, idx) => (
            <div key={idx} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-center">
              <div className="text-[9px] font-semibold text-slate-500 uppercase">{metric.label}</div>
              <div className="text-xs font-bold text-slate-900">{metric.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
