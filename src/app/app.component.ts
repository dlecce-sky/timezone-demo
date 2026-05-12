import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { BookingsComponent } from './components/bookings.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FakeDbService } from './services/fake-db.service';
import { Booking } from './models/booking.model';

@Component({
  selector: 'app-root',
  imports: [BookingsComponent, MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bookings
      [bookings]="bookings()"
      (bookingCreated)="onBookingCreated($event)"
      (bookingUpdated)="onBookingUpdated($event)"
      (bookingDeleted)="onBookingDeleted($event)"
    />
  `,
})
export class AppComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly fakeDb = inject(FakeDbService);

  readonly bookings = signal<Booking[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  onBookingCreated(booking: Booking) {
    this.fakeDb.add(booking);
    this.refresh();
  }

  onBookingUpdated(booking: Booking) {
    this.fakeDb.update(booking);
    this.refresh();
  }

  onBookingDeleted(id: string) {
    this.fakeDb.delete(id);
    this.refresh();
  }

  private refresh() {
    this.bookings.set(this.fakeDb.getAll());
  }
}
