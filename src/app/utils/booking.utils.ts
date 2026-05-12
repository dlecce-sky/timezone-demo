import { Booking, BookingFormValue, BookingJson } from '../models/booking.model';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export function toBooking(bookingJson: BookingJson): Booking {
  return {
    ...bookingJson,
    from: new Date(bookingJson.from),
    to: new Date(bookingJson.to),
  };
}

export function mapToUtcBooking(f: BookingFormValue): Booking {
  const id = required(f.id, 'id');
  const from = required(f.from, 'from');
  const to = required(f.to, 'to');
  const timezone = required(f.timezone, 'timezone');
  const startTime = required(f.startTime, 'startTime');
  const duration = required(f.duration, 'duration');
  const days = required(f.days, 'days');

  return {
    id,
    timezone,
    startTime,
    duration,
    days,
    from: zonedTimeToUtc(from, timezone),
    to: zonedTimeToUtc(to, timezone),
  };
}

export function mapToZonedBooking(booking: Booking): Booking {
  return {
    ...booking,
    from: utcToZonedTime(booking.from, booking.timezone),
    to: utcToZonedTime(booking.to, booking.timezone),
  };
}

function required<T>(val: T | null | undefined, what: string): T {
  if (val === null || val === undefined) throw new Error(`${what} is required`);
  return val;
}
