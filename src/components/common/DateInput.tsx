import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import {
  formatAsDateInput,
  parseDateParts,
  formatDateToDisplay,
  formatDateToISO,
} from '../../utils/dateUtils';

interface DateInputProps {
  id?: string;
  name?: string;
  value?: string; // Can be DD/MM/YYYY or YYYY-MM-DD
  onChange: (value: string, isoValue: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  label?: string;
  helperText?: string;
  minYear?: number;
  maxYear?: number;
  size?: 'sm' | 'md';
  showCalendarButton?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  name,
  value = '',
  onChange,
  onBlur,
  placeholder = 'DD/MM/YYYY',
  required = false,
  disabled = false,
  className = '',
  error,
  label,
  helperText,
  minYear = 1990,
  maxYear = 2035,
  size = 'md',
  showCalendarButton = true,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => formatDateToDisplay(value));
  const [internalError, setInternalError] = useState<string | null>(null);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const formatted = formatDateToDisplay(value);
    setDisplayValue(formatted);
  }, [value]);

  const validateAndPropagate = (inputValue: string) => {
    if (!inputValue.trim()) {
      setInternalError(null);
      onChange('', '');
      return;
    }

    const parts = parseDateParts(inputValue);
    if (!parts) {
      // Incomplete typing
      if (inputValue.replace(/\D/g, '').length < 8) {
        setInternalError('Please enter full date (DD/MM/YYYY)');
      } else {
        setInternalError('Invalid date format. Use DD/MM/YYYY');
      }
      onChange(inputValue, '');
      return;
    }

    if (!parts.isValid) {
      if (parts.month < 1 || parts.month > 12) {
        setInternalError(`Invalid month (${parts.month}).`);
      } else if (parts.day < 1 || parts.day > 31) {
        setInternalError(`Invalid day (${parts.day}).`);
      } else {
        setInternalError(`Invalid date (${inputValue}).`);
      }
      onChange(inputValue, '');
      return;
    }

    if (parts.year < minYear || parts.year > maxYear) {
      setInternalError(`Year must be between ${minYear} and ${maxYear}.`);
      onChange(inputValue, '');
      return;
    }

    setInternalError(null);
    const dayStr = String(parts.day).padStart(2, '0');
    const monthStr = String(parts.month).padStart(2, '0');
    const iso = `${parts.year}-${monthStr}-${dayStr}`;
    onChange(`${dayStr}/${monthStr}/${parts.year}`, iso);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Auto format progressive typing (e.g. 01082026 -> 01/08/2026)
    const formatted = formatAsDateInput(raw);
    setDisplayValue(formatted);

    // If fully entered (10 chars e.g. DD/MM/YYYY), validate immediately
    if (formatted.length === 10) {
      validateAndPropagate(formatted);
    } else {
      setInternalError(null);
      onChange(formatted, '');
    }
  };

  const handleBlur = () => {
    validateAndPropagate(displayValue);
    if (onBlur) onBlur();
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoValue = e.target.value; // YYYY-MM-DD
    if (!isoValue) return;
    const formatted = formatDateToDisplay(isoValue);
    setDisplayValue(formatted);
    setInternalError(null);
    onChange(formatted, isoValue);
  };

  const openCalendarPicker = () => {
    if (disabled) return;
    try {
      if (nativePickerRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
          (nativePickerRef.current as any).showPicker();
        } else {
          nativePickerRef.current.focus();
        }
      }
    } catch {
      nativePickerRef.current?.focus();
    }
  };

  const activeError = error || internalError;
  const currentISO = formatDateToISO(displayValue);

  const paddingClasses = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9/]*"
          maxLength={10}
          value={displayValue}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${paddingClasses} ${
            showCalendarButton ? 'pr-8' : ''
          } bg-white text-slate-900 placeholder:text-slate-400 border rounded-lg focus:bg-white focus:ring-2 outline-none font-medium transition-all ${
            activeError
              ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30'
              : 'border-slate-300 focus:ring-blue-900/20 focus:border-blue-900'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''} ${className}`}
        />

        {showCalendarButton && (
          <button
            type="button"
            tabIndex={-1}
            onClick={openCalendarPicker}
            disabled={disabled}
            className="absolute right-2 text-slate-400 hover:text-slate-700 disabled:opacity-40 p-0.5 rounded transition-colors"
            title="Open calendar picker"
            aria-label="Open calendar picker"
          >
            <CalendarIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        )}

        {/* Hidden native date input synced to current ISO */}
        <input
          ref={nativePickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={currentISO || ''}
          onChange={handleNativePickerChange}
          disabled={disabled}
          className="sr-only"
        />
      </div>

      {activeError ? (
        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{activeError}</span>
        </p>
      ) : helperText ? (
        <p className="text-[10px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

