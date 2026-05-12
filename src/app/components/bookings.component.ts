import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FakeDbService } from '../services/fake-db.service';
import { Booking, BookingJson, toBooking } from '../models/booking.model';

@Component({
  selector: 'app-bookings',
  template: `
    <h2>Bookings</h2>
    <ul>
      @for (booking of this.bookings(); track booking.id) {
        <li>{{ booking.id }} - {{ booking.from }} to {{ booking.to }}</li>
      }
    </ul>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsComponent implements OnInit {
  readonly fakeDb = inject(FakeDbService);

  readonly bookings = signal<Booking[]>([]);

  ngOnInit(): void {
    const bookings = this.fakeDb.getAll<BookingJson>().map(toBooking);
    this.bookings.set(bookings);
  }
}
