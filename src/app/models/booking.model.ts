import { FormControl } from '@angular/forms';

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

export interface BookingFormValue {
  id: string | null | undefined;
  from: Date | null | undefined;
  to: Date | null | undefined;
  timezone: string | null | undefined;
  startTime: string | null | undefined;
  duration: string | null | undefined;
  days: string[] | null | undefined;
}

type ControlsOf<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export type BookingFormControls = ControlsOf<BookingFormValue>;
