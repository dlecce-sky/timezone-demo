/// <reference types="jasmine" />

import { BookingFormValue } from '../models/booking.model';
import { buildTimelinePreviewState, formatTimelineDate } from './timeline-preview.utils';

describe('timeline-preview.utils', () => {
  it('keeps recurring Europe/Rome occurrences at the same local start time across the spring DST change', () => {
    const state = buildTimelinePreviewState(
      createBookingFormValue({
        from: createLocalDate(2026, 3, 22, 0, 0),
        to: createLocalDate(2026, 3, 30, 23, 59),
        startTime: '09:00',
        duration: '2h',
        days: ['0'],
      }),
    );

    expect(state).not.toBeNull();
    expect(state?.occurrences.map((occurrence) => occurrence.startUtc.toISOString())).toEqual([
      '2026-03-22T08:00:00.000Z',
      '2026-03-29T07:00:00.000Z',
    ]);
    expect(state?.occurrences.map((occurrence) => formatHourMinute(occurrence.startUtc))).toEqual([
      '09:00',
      '09:00',
    ]);
  });

  it('keeps recurring Europe/Rome occurrences at the same local start time across the autumn DST change', () => {
    const state = buildTimelinePreviewState(
      createBookingFormValue({
        from: createLocalDate(2026, 10, 18, 0, 0),
        to: createLocalDate(2026, 10, 26, 23, 59),
        startTime: '09:00',
        duration: '2h',
        days: ['0'],
      }),
    );

    expect(state).not.toBeNull();
    expect(state?.occurrences.map((occurrence) => occurrence.startUtc.toISOString())).toEqual([
      '2026-10-18T07:00:00.000Z',
      '2026-10-25T08:00:00.000Z',
    ]);
    expect(state?.occurrences.map((occurrence) => formatHourMinute(occurrence.startUtc))).toEqual([
      '09:00',
      '09:00',
    ]);
  });

  it('preserves real duration for an occurrence that crosses the spring-forward DST jump', () => {
    const state = buildTimelinePreviewState(
      createBookingFormValue({
        from: createLocalDate(2026, 3, 29, 0, 0),
        to: createLocalDate(2026, 3, 29, 23, 59),
        startTime: '01:30',
        duration: '1h',
        days: ['0'],
      }),
    );

    expect(state).not.toBeNull();
    expect(state?.occurrences.length).toBe(1);
    expect(state?.occurrences[0]?.startUtc.toISOString()).toBe('2026-03-29T00:30:00.000Z');
    expect(state?.occurrences[0]?.endUtc.toISOString()).toBe('2026-03-29T01:30:00.000Z');
    expect(formatHourMinute(state!.occurrences[0].startUtc)).toBe('01:30');
    expect(formatHourMinute(state!.occurrences[0].endUtc)).toBe('03:30');
  });
});

function createBookingFormValue(overrides: Partial<BookingFormValue>): BookingFormValue {
  return {
    id: 'booking-test',
    from: createLocalDate(2026, 3, 22, 0, 0),
    to: createLocalDate(2026, 3, 30, 23, 59),
    timezone: 'Europe/Rome',
    startTime: '09:00',
    duration: '2h',
    days: ['0'],
    ...overrides,
  };
}

function createLocalDate(year: number, month: number, day: number, hours: number, minutes: number) {
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function formatHourMinute(value: Date) {
  return formatTimelineDate(value, 'Europe/Rome', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  });
}
