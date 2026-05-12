import { Pipe, PipeTransform } from '@angular/core';

const DAY_LABELS: Record<string, string> = {
  '0': 'Sun',
  '1': 'Mon',
  '2': 'Tue',
  '3': 'Wed',
  '4': 'Thu',
  '5': 'Fri',
  '6': 'Sat',
};

@Pipe({
  name: 'bookingDays',
})
export class BookingDaysPipe implements PipeTransform {
  transform(days: string[] | null | undefined): string {
    if (!days?.length) {
      return '';
    }

    return days
      .map((day) => DAY_LABELS[day])
      .filter(Boolean)
      .join(', ');
  }
}
