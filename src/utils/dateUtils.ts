/**
 * Centralized Date Utilities for St. Xavier High School Portal
 * Standardizes user-facing dates to DD/MM/YYYY and handles DOB formatting & validation.
 */

/**
 * Checks if a given day, month, year represents a real valid calendar date.
 */
export function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day >= 1 && day <= daysInMonth[month - 1];
}

/**
 * Parses and extracts day, month, year from various date string formats:
 * - DD/MM/YYYY (e.g. 03/02/2015)
 * - YYYY-MM-DD (e.g. 2015-02-03)
 * - DD-MM-YYYY (e.g. 03-02-2015)
 * - ISO string (e.g. 2015-02-03T18:00:00.000Z)
 * - Raw digits 8-length (e.g. 03022015 or 20150203)
 */
export function parseDateParts(dateInput?: string | null): {
  day: number;
  month: number;
  year: number;
  isValid: boolean;
} | null {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  if (!str) return null;

  // 1. Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    return {
      day,
      month,
      year,
      isValid: isValidCalendarDate(day, month, year),
    };
  }

  // 2. Check YYYY-MM-DD or YYYY/MM/DD or ISO string
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return {
      day,
      month,
      year,
      isValid: isValidCalendarDate(day, month, year),
    };
  }

  // 3. Check 8 digits only
  const digits = str.replace(/\D/g, '');
  if (digits.length === 8) {
    // If starts with 19xx or 20xx -> YYYYMMDD
    if (digits.startsWith('19') || digits.startsWith('20')) {
      const year = parseInt(digits.slice(0, 4), 10);
      const month = parseInt(digits.slice(4, 6), 10);
      const day = parseInt(digits.slice(6, 8), 10);
      if (isValidCalendarDate(day, month, year)) {
        return { day, month, year, isValid: true };
      }
    }
    // Else check DDMMYYYY
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);
    if (isValidCalendarDate(day, month, year)) {
      return { day, month, year, isValid: true };
    }
  }

  // 4. Try native Date parse fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return {
      day,
      month,
      year,
      isValid: isValidCalendarDate(day, month, year),
    };
  }

  return null;
}

/**
 * Standardizes any date to user-facing format: DD/MM/YYYY
 * Example: 2015-02-03 -> 03/02/2015
 * Example: 28-08-2026 -> 28/08/2026
 */
export function formatDateToDisplay(dateInput?: string | null | Date): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = String(dateInput.getFullYear());
    return `${day}/${month}/${year}`;
  }

  const parts = parseDateParts(String(dateInput));
  if (!parts || !parts.isValid) {
    // If it's already a clean string or custom notice date, return trimmed string or fallback
    return String(dateInput).trim();
  }

  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = String(parts.month).padStart(2, '0');
  const yearStr = String(parts.year);
  return `${dayStr}/${monthStr}/${yearStr}`;
}

/**
 * Converts user-facing DD/MM/YYYY or other date inputs to standard ISO YYYY-MM-DD
 * for internal Firestore storage consistency.
 */
export function formatDateToISO(dateInput?: string | null): string {
  if (!dateInput) return '';
  const parts = parseDateParts(dateInput);
  if (!parts || !parts.isValid) {
    return dateInput.trim();
  }
  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = String(parts.month).padStart(2, '0');
  const yearStr = String(parts.year);
  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Authoritative temporary password generation from Date of Birth.
 * Specification: Exactly DDMMYY (e.g., DOB 03/02/2015 -> 030215).
 * No prefix, suffix, separators, or letters.
 */
export function generateInitialStudentPassword(dateOfBirth?: string | null): string {
  if (!dateOfBirth) return '010126';
  const parts = parseDateParts(dateOfBirth);
  if (parts && parts.isValid) {
    const dayStr = String(parts.day).padStart(2, '0');
    const monthStr = String(parts.month).padStart(2, '0');
    const yearStr = String(parts.year).slice(-2); // Last 2 digits of year (e.g. 2015 -> 15)
    return `${dayStr}${monthStr}${yearStr}`;
  }

  // Fallback if parsing fails: take digits
  const digits = dateOfBirth.replace(/\D/g, '');
  if (digits.length === 8) {
    // If YYYYMMDD
    if (digits.startsWith('19') || digits.startsWith('20')) {
      const yy = digits.slice(2, 4);
      const mm = digits.slice(4, 6);
      const dd = digits.slice(6, 8);
      return `${dd}${mm}${yy}`;
    }
    // If DDMMYYYY
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yy = digits.slice(6, 8);
    return `${dd}${mm}${yy}`;
  }
  if (digits.length === 6) {
    return digits;
  }
  return '010126';
}

/**
 * Formats user input as they type numbers into DD/MM/YYYY format.
 * E.g., typing '03022015' will progressively format into '03/02/2015'.
 */
export function formatAsDateInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}
