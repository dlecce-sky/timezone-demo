/// <reference types="jasmine" />

import { BookingFormValue } from '../models/booking.model';
import { mapToUtcBooking, mapToZonedBooking } from './booking.utils';

describe('booking.utils', () => {
  it('converts Europe/Rome local wall-clock times to different UTC instants across spring DST', () => {
    const beforeDst = mapToUtcBooking(
      createBookingFormValue({
        from: createLocalDate(2026, 3, 22, 9, 0),
        to: createLocalDate(2026, 3, 22, 11, 0),
      }),
    );
    const afterDst = mapToUtcBooking(
      createBookingFormValue({
        from: createLocalDate(2026, 3, 29, 9, 0),
        to: createLocalDate(2026, 3, 29, 11, 0),
      }),
    );

    expect(beforeDst.from.toISOString()).toBe('2026-03-22T08:00:00.000Z');
    expect(beforeDst.to.toISOString()).toBe('2026-03-22T10:00:00.000Z');
    expect(afterDst.from.toISOString()).toBe('2026-03-29T07:00:00.000Z');
    expect(afterDst.to.toISOString()).toBe('2026-03-29T09:00:00.000Z');
  });

  it('round-trips Europe/Rome wall-clock times across the autumn DST change', () => {
    const utcBooking = mapToUtcBooking(
      createBookingFormValue({
        from: createLocalDate(2026, 10, 25, 9, 0),
        to: createLocalDate(2026, 10, 25, 12, 15),
      }),
    );

    expect(utcBooking.from.toISOString()).toBe('2026-10-25T08:00:00.000Z');
    expect(utcBooking.to.toISOString()).toBe('2026-10-25T11:15:00.000Z');

    const zonedBooking = mapToZonedBooking(utcBooking);

    expectLocalDate(zonedBooking.from, 2026, 10, 25, 9, 0);
    expectLocalDate(zonedBooking.to, 2026, 10, 25, 12, 15);
  });
});

function createBookingFormValue(overrides: Partial<BookingFormValue>): BookingFormValue {
  return {
    id: 'booking-test',
    from: createLocalDate(2026, 3, 22, 9, 0),
    to: createLocalDate(2026, 3, 22, 11, 0),
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

function expectLocalDate(
  value: Date,
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
) {
  expect(value.getFullYear()).toBe(year);
  expect(value.getMonth()).toBe(month - 1);
  expect(value.getDate()).toBe(day);
  expect(value.getHours()).toBe(hours);
  expect(value.getMinutes()).toBe(minutes);
}
