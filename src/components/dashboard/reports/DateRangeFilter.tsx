import React, { useMemo } from 'react';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { DateInput } from '../../common/DateInput';
import { isFromDateAfterToDate, formatDateRangeDisplay } from '../../../utils/dateUtils';

export interface DateRangeState {
  fromDate: string; // DD/MM/YYYY
  toDate: string;   // DD/MM/YYYY
  fromISO: string;  // YYYY-MM-DD
  toISO: string;    // YYYY-MM-DD
}

interface DateRangeFilterProps {
  idPrefix?: string;
  fromDate: string;
  toDate: string;
  fromISO: string;
  toISO: string;
  onChange: (range: DateRangeState) => void;
  onClear: () => void;
  className?: string;
  label?: string;
  compact?: boolean;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  idPrefix = 'report-date-filter',
  fromDate,
  toDate,
  fromISO,
  toISO,
  onChange,
  onClear,
  className = '',
  label = 'Date Range',
  compact = false,
}) => {
  const isInvalidRange = useMemo(() => {
    return isFromDateAfterToDate(fromISO, toISO);
  }, [fromISO, toISO]);

  const hasActiveRange = Boolean((fromDate && fromDate.trim()) || (toDate && toDate.trim()));

  const handleFromChange = (newVal: string, newISO: string) => {
    onChange({
      fromDate: newVal,
      fromISO: newISO,
      toDate,
      toISO,
    });
  };

  const handleToChange = (newVal: string, newISO: string) => {
    onChange({
      fromDate,
      fromISO,
      toDate: newVal,
      toISO: newISO,
    });
  };

  // Active summary description
  const activeRangeText = useMemo(() => {
    return formatDateRangeDisplay(fromDate, toDate);
  }, [fromDate, toDate]);

  return (
    <div
      id={`${idPrefix}-container`}
      className={`bg-slate-50/70 border border-slate-200/80 rounded-xl p-2 sm:p-2.5 transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-900" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            {label}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">(DD/MM/YYYY)</span>
        </div>

        {hasActiveRange && (
          <button
            type="button"
            id={`${idPrefix}-clear-btn`}
            onClick={onClear}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
            title="Clear active date filter"
          >
            <X className="w-2.5 h-2.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <DateInput
            id={`${idPrefix}-from`}
            name="fromDate"
            value={fromDate}
            onChange={handleFromChange}
            placeholder="From: DD/MM/YYYY"
            size="sm"
            showCalendarButton={true}
            className="text-xs"
          />
        </div>
        <div>
          <DateInput
            id={`${idPrefix}-to`}
            name="toDate"
            value={toDate}
            onChange={handleToChange}
            placeholder="To: DD/MM/YYYY"
            size="sm"
            showCalendarButton={true}
            className="text-xs"
          />
        </div>
      </div>

      {isInvalidRange && (
        <div
          id={`${idPrefix}-error`}
          className="mt-1.5 px-2 py-1 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 text-[11px] font-medium text-rose-700 animate-in fade-in"
        >
          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>From Date cannot be later than To Date</span>
        </div>
      )}

      {hasActiveRange && !isInvalidRange && activeRangeText && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-blue-900 bg-blue-50/60 px-2 py-0.5 rounded-md border border-blue-100/80">
          <span className="font-medium truncate">Filtering: {activeRangeText} (Inclusive)</span>
        </div>
      )}
    </div>
  );
};
