import { addDays, addMinutes, addWeeks, startOfDay, startOfWeek } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { BookingFormValue } from '../models/booking.model';

export interface TimelineOccurrence {
  id: string;
  startUtc: Date;
  endUtc: Date;
}

export interface TimelinePreviewState {
  isRecurrenceReady: boolean;
  timezone: string;
  rangeStartUtc: Date;
  rangeEndUtc: Date;
  rangeStartZoned: Date;
  rangeEndZoned: Date;
  weekStarts: Date[];
  occurrences: TimelineOccurrence[];
}

interface ParsedStartTime {
  hours: number;
  minutes: number;
}

export function buildTimelinePreviewState(
  booking: BookingFormValue | null | undefined,
): TimelinePreviewState | null {
  if (!booking) {
    return null;
  }

  const timezone = booking.timezone?.trim();
  const from = booking.from;
  const to = booking.to;

  if (!timezone || !isValidDate(from) || !isValidDate(to)) {
    return null;
  }

  const rangeStartUtc = zonedTimeToUtc(from, timezone);
  const rangeEndUtc = zonedTimeToUtc(to, timezone);

  if (rangeEndUtc.getTime() <= rangeStartUtc.getTime()) {
    return null;
  }

  const rangeStartZoned = utcToZonedTime(rangeStartUtc, timezone);
  const rangeEndZoned = utcToZonedTime(rangeEndUtc, timezone);
  const weekStarts = listWeekStarts(rangeStartZoned, rangeEndZoned);
  const days = parseDays(booking.days);
  const startTimes = parseStartTimes(booking.startTime);
  const durationMinutes = parseDurationMinutes(booking.duration);
  const isRecurrenceReady = Boolean(days && startTimes && durationMinutes !== null);
  const occurrences =
    days && startTimes && durationMinutes !== null
      ? buildOccurrences({
          days,
          durationMinutes,
          rangeEndUtc,
          rangeEndZoned,
          rangeStartUtc,
          rangeStartZoned,
          startTimes,
          timezone,
        })
      : [];

  return {
    isRecurrenceReady,
    timezone,
    rangeStartUtc,
    rangeEndUtc,
    rangeStartZoned,
    rangeEndZoned,
    weekStarts,
    occurrences,
  };
}

export function getWeekRangeUtc(weekStartZoned: Date, timezone: string) {
  const weekEndZoned = addWeeks(weekStartZoned, 1);

  return {
    weekEndUtc: zonedTimeToUtc(weekEndZoned, timezone),
    weekStartUtc: zonedTimeToUtc(weekStartZoned, timezone),
  };
}

export function listWeekTickValues(weekStartZoned: Date, timezone: string): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    return zonedTimeToUtc(addDays(weekStartZoned, index), timezone);
  });
}

export function formatTimelineDate(date: Date, timezone: string, formatString: string) {
  return formatInTimeZone(date, timezone, formatString, { locale: enGB });
}

export function clipOccurrenceToRange(
  occurrence: TimelineOccurrence,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
) {
  const startUtc = new Date(Math.max(occurrence.startUtc.getTime(), rangeStartUtc.getTime()));
  const endUtc = new Date(Math.min(occurrence.endUtc.getTime(), rangeEndUtc.getTime()));

  if (endUtc.getTime() <= startUtc.getTime()) {
    return null;
  }

  return { endUtc, startUtc };
}

export function parseDurationMinutes(duration: string | null | undefined): number | null {
  if (!duration?.trim()) {
    return null;
  }

  const match = duration.match(/^\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*$/i);

  if (!match) {
    return null;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const totalMinutes = hours * 60 + minutes;

  return totalMinutes > 0 ? totalMinutes : null;
}

function buildOccurrences(args: {
  days: Set<number>;
  durationMinutes: number;
  rangeEndUtc: Date;
  rangeEndZoned: Date;
  rangeStartUtc: Date;
  rangeStartZoned: Date;
  startTimes: ParsedStartTime[];
  timezone: string;
}): TimelineOccurrence[] {
  const occurrences: TimelineOccurrence[] = [];
  const lastDay = startOfDay(args.rangeEndZoned);

  for (
    let cursor = startOfDay(args.rangeStartZoned);
    cursor.getTime() <= lastDay.getTime();
    cursor = addDays(cursor, 1)
  ) {
    if (!args.days.has(cursor.getDay())) {
      continue;
    }

    for (const startTime of args.startTimes) {
      const localStart = new Date(cursor);
      localStart.setHours(startTime.hours, startTime.minutes, 0, 0);

      const startUtc = zonedTimeToUtc(localStart, args.timezone);
      const endUtc = addMinutes(startUtc, args.durationMinutes);

      if (startUtc.getTime() < args.rangeStartUtc.getTime()) {
        continue;
      }

      if (endUtc.getTime() > args.rangeEndUtc.getTime()) {
        continue;
      }

      occurrences.push({
        endUtc,
        id: `${startUtc.toISOString()}-${startTime.hours}-${startTime.minutes}`,
        startUtc,
      });
    }
  }

  return occurrences.sort((left, right) => left.startUtc.getTime() - right.startUtc.getTime());
}

function listWeekStarts(rangeStartZoned: Date, rangeEndZoned: Date): Date[] {
  const firstWeekStart = startOfWeek(rangeStartZoned, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(rangeEndZoned, { weekStartsOn: 1 });
  const weeks: Date[] = [];

  for (
    let cursor = firstWeekStart;
    cursor.getTime() <= lastWeekStart.getTime();
    cursor = addWeeks(cursor, 1)
  ) {
    weeks.push(cursor);
  }

  return weeks;
}

function parseDays(days: string[] | null | undefined): Set<number> | null {
  if (!days?.length) {
    return null;
  }

  const parsed = days
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  if (!parsed.length) {
    return null;
  }

  return new Set(parsed);
}

function parseStartTimes(startTime: string | null | undefined): ParsedStartTime[] | null {
  if (!startTime?.trim()) {
    return null;
  }

  const parsed = startTime
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const match = value.match(/^(\d{1,2}):(\d{2})$/);

      if (!match) {
        return null;
      }

      const hours = Number(match[1]);
      const minutes = Number(match[2]);

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }

      return { hours, minutes };
    });

  if (!parsed.length || parsed.some((value) => value === null)) {
    return null;
  }

  const validParsed = parsed.filter((value): value is ParsedStartTime => value !== null);

  return validParsed.sort((left, right) => {
    return left.hours * 60 + left.minutes - (right.hours * 60 + right.minutes);
  });
}

function isValidDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
