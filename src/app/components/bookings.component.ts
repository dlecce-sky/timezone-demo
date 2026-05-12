import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Booking } from '../models/booking.model';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { BookingDialogComponent } from './booking-dialog.component';
import { BookingDaysPipe } from '../pipes/booking-days.pipe';
import { mapToZonedBooking } from '../utils/booking.utils';

@Component({
  selector: 'app-bookings',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTableModule, BookingDaysPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button mat-raised-button (click)="addBooking()">Add Booking</button>
    <section class="bookings">
      <h2>Bookings</h2>

      @if (zonedBookings().length) {
        <table mat-table [dataSource]="zonedBookings()">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let booking">{{ booking.id }}</td>
          </ng-container>

          <!-- From Column -->
          <ng-container matColumnDef="from">
            <th mat-header-cell *matHeaderCellDef>From</th>
            <td mat-cell *matCellDef="let booking">
              {{ booking.from | date: 'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <!-- To Column -->
          <ng-container matColumnDef="to">
            <th mat-header-cell *matHeaderCellDef>To</th>
            <td mat-cell *matCellDef="let booking">{{ booking.to | date: 'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>

          <!-- Timezone Column -->
          <ng-container matColumnDef="timezone">
            <th mat-header-cell *matHeaderCellDef>Timezone</th>
            <td mat-cell *matCellDef="let booking">{{ booking.timezone }}</td>
          </ng-container>

          <!-- Start Time Column -->
          <ng-container matColumnDef="startTime">
            <th mat-header-cell *matHeaderCellDef>Start Time</th>
            <td mat-cell *matCellDef="let booking">{{ booking.startTime }}</td>
          </ng-container>

          <!-- Duration Column -->
          <ng-container matColumnDef="duration">
            <th mat-header-cell *matHeaderCellDef>Duration</th>
            <td mat-cell *matCellDef="let booking">{{ booking.duration }}</td>
          </ng-container>

          <!-- Days Column -->
          <ng-container matColumnDef="days">
            <th mat-header-cell *matHeaderCellDef>Days</th>
            <td mat-cell *matCellDef="let booking">{{ booking.days | bookingDays }}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let booking">
              <button mat-icon-button (click)="editBooking(booking)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteBooking(booking.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      } @else {
        <p>No bookings saved yet.</p>
      }
    </section>
  `,
  styles: `
    .bookings {
      margin-top: 1rem;

      h2 {
        margin-bottom: 1rem;
      }

      table {
        width: 100%;
      }
    }
  `,
})
export class BookingsComponent {
  readonly bookings = input.required<Booking[]>();
  readonly bookingCreated = output<Booking>();
  readonly bookingUpdated = output<Booking>();
  readonly bookingDeleted = output<string>();

  readonly zonedBookings = computed<Booking[]>(() => {
    return this.bookings().map(mapToZonedBooking);
  });

  readonly dialogSettings = {
    minWidth: '1200px',
    minHeight: '600px',
    autoFocus: 'dialog',
  };

  readonly dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'id',
    'from',
    'to',
    'timezone',
    'startTime',
    'duration',
    'days',
    'actions',
  ];

  addBooking() {
    const dialogRef = this.dialog.open<BookingDialogComponent, Booking, Booking>(
      BookingDialogComponent,
      {
        ...this.dialogSettings,
        data: null,
      },
    );

    dialogRef.afterClosed().subscribe((booking) => {
      if (booking) {
        this.bookingCreated.emit(booking);
      }
    });
  }

  editBooking(booking: Booking) {
    const dialogRef = this.dialog.open<BookingDialogComponent, Booking, Booking>(
      BookingDialogComponent,
      {
        ...this.dialogSettings,
        data: booking,
      },
    );

    dialogRef.afterClosed().subscribe((booking) => {
      if (booking) {
        this.bookingUpdated.emit(booking);
      }
    });
  }

  deleteBooking(id: string) {
    this.bookingDeleted.emit(id);
  }
}
