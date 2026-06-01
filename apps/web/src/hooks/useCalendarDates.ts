// =============================================================================
// useCalendarDates — Date calculation logic for calendar grids
// =============================================================================

import {
  startOfMonth,
  getDay,
  getDaysInMonth,
  getISOWeek,
  format,
} from 'date-fns';
import { es, enUS, enGB, fr, de, it, pt, ptBR, ca, gl, eu } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Locale, StartDayOfWeek } from '@calendar-creator/shared-types';

const LOCALE_MAP: Record<Locale, DateFnsLocale> = {
  'es-ES': es,
  'en-US': enUS,
  'en-GB': enGB,
  'fr-FR': fr,
  'de-DE': de,
  'it-IT': it,
  'pt-PT': pt,
  'pt-BR': ptBR,
  'ca-ES': ca,
  'gl-ES': gl,
  'eu-ES': eu,
};

export interface CalendarDay {
  /** Day number (1-31) */
  day: number;
  /** Whether this day belongs to the current month */
  isCurrentMonth: boolean;
  /** Whether this is a Sunday */
  isSunday: boolean;
  /** Whether this is a Saturday */
  isSaturday: boolean;
  /** ISO week number */
  weekNumber: number;
  /** Full date object */
  date: Date;
}

export interface CalendarMonth {
  /** Localized month name */
  monthName: string;
  /** Year */
  year: number;
  /** Month number (1-12) */
  month: number;
  /** Localized day-of-week abbreviations (7 items) */
  dayNames: string[];
  /** Grid of days organized by weeks (6 rows × 7 columns) */
  weeks: CalendarDay[][];
  /** Total days in this month */
  totalDays: number;
}

/**
 * Generate the complete calendar data for a given month.
 */
export function useCalendarDates(
  year: number,
  month: number,
  locale: Locale,
  startDay: StartDayOfWeek = 'monday',
  shortDayNames: boolean = true
): CalendarMonth {
  const dateFnsLocale = LOCALE_MAP[locale] ?? es;
  const date = new Date(year, month - 1, 1);
  const totalDays = getDaysInMonth(date);
  const firstDayOfMonth = startOfMonth(date);

  // Get day of week for the first day (0=Sun, 6=Sat)
  let firstDow = getDay(firstDayOfMonth);

  // Adjust for start day of week
  if (startDay === 'monday') {
    firstDow = firstDow === 0 ? 6 : firstDow - 1;
  }

  // Generate day names
  const dayNames: string[] = [];
  const startIdx = startDay === 'monday' ? 1 : 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, startIdx + i); // Jan 2024 started on Monday
    dayNames.push(format(d, shortDayNames ? 'EEEEEE' : 'EEEE', { locale: dateFnsLocale }));
  }

  // Month name
  const monthName = format(date, 'MMMM', { locale: dateFnsLocale });

  // Generate weeks grid (max 6 rows)
  const weeks: CalendarDay[][] = [];
  let currentDay = 1;
  let prevMonthDay = getDaysInMonth(new Date(year, month - 2, 1)) - firstDow + 1;

  for (let week = 0; week < 6; week++) {
    const weekDays: CalendarDay[] = [];

    for (let dow = 0; dow < 7; dow++) {
      const cellIndex = week * 7 + dow;

      if (cellIndex < firstDow) {
        // Previous month
        const d = new Date(year, month - 2, prevMonthDay);
        weekDays.push({
          day: prevMonthDay,
          isCurrentMonth: false,
          isSunday: startDay === 'monday' ? dow === 6 : dow === 0,
          isSaturday: startDay === 'monday' ? dow === 5 : dow === 6,
          weekNumber: getISOWeek(d),
          date: d,
        });
        prevMonthDay++;
      } else if (currentDay <= totalDays) {
        // Current month
        const d = new Date(year, month - 1, currentDay);
        weekDays.push({
          day: currentDay,
          isCurrentMonth: true,
          isSunday: startDay === 'monday' ? dow === 6 : dow === 0,
          isSaturday: startDay === 'monday' ? dow === 5 : dow === 6,
          weekNumber: getISOWeek(d),
          date: d,
        });
        currentDay++;
      } else {
        // Next month
        const nextDay = currentDay - totalDays;
        const d = new Date(year, month, nextDay);
        weekDays.push({
          day: nextDay,
          isCurrentMonth: false,
          isSunday: startDay === 'monday' ? dow === 6 : dow === 0,
          isSaturday: startDay === 'monday' ? dow === 5 : dow === 6,
          weekNumber: getISOWeek(d),
          date: d,
        });
        currentDay++;
      }
    }

    // Only add week if it has days from the current month
    if (weekDays.some((d) => d.isCurrentMonth)) {
      weeks.push(weekDays);
    }
  }

  return {
    monthName,
    year,
    month,
    dayNames,
    weeks,
    totalDays,
  };
}
