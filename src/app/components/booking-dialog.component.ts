import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Booking } from '../models/booking.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-booking-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ booking ? 'Edit' : 'New' }} Booking</h2>

    <mat-dialog-content class="mat-typography"></mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class BookingDialogComponent {
  booking = inject<Booking | null>(MAT_DIALOG_DATA);

  save() {
    // Implement save logic here
  }
}
