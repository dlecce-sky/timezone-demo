export interface BookingJson {
  id: string;
  from: string;
  to: string;
  timezone: string;
  startTime: string;
  duration: string;
  days: string[];
}

export interface Booking extends Omit<BookingJson, 'from' | 'to'> {
  from: Date;
  to: Date;
}

export function toBooking(bookingJson: BookingJson): Booking {
  return {
    ...bookingJson,
    from: new Date(bookingJson.from),
    to: new Date(bookingJson.to),
  };
}
