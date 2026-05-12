import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Booking, BookingFormControls } from '../models/booking.model';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DatetimePickerComponent, DatetimePickerToggleComponent } from '@sky-it-common/sky-ui';

@Component({
  selector: 'app-booking-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    JsonPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DatetimePickerComponent,
    DatetimePickerToggleComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ booking ? 'Edit' : 'New' }} Booking</h2>

    <mat-dialog-content class="mat-typography">
      @if (form(); as form) {
        <div class="row">
          <mat-form-field>
            <mat-label>From</mat-label>
            <sky-ui-datetime-picker #fromPicker [formControl]="form.controls.from" />
            <sky-ui-datetime-picker-toggle matSuffix [for]="fromPicker" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>To</mat-label>
            <sky-ui-datetime-picker #toPicker [formControl]="form.controls.to" />
            <sky-ui-datetime-picker-toggle matSuffix [for]="toPicker" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>Timezone</mat-label>
            <mat-select [formControl]="form.controls.timezone">
              <mat-option value="Europe/Rome">Europe/Rome</mat-option>
              <mat-option value="Europe/London">Europe/London</mat-option>
              <mat-option value="Asia/Kolkata">Asia/Kolkata</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field>
            <mat-label>Start Time</mat-label>
            <input matInput [formControl]="form.controls.startTime" />
            <mat-hint>HH:MM (commas separated)</mat-hint>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Duration</mat-label>
            <input matInput [formControl]="form.controls.duration" />
            <mat-hint>e.g. 2h 10m</mat-hint>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Days</mat-label>
            <mat-select multiple [formControl]="form.controls.days">
              <mat-option value="1">Mon</mat-option>
              <mat-option value="2">Tue</mat-option>
              <mat-option value="3">Wed</mat-option>
              <mat-option value="4">Thu</mat-option>
              <mat-option value="5">Fri</mat-option>
              <mat-option value="6">Sat</mat-option>
              <mat-option value="0">Sun</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <pre>{{ form.value | json }}</pre>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export class BookingDialogComponent implements OnInit {
  readonly booking = inject<Booking | null>(MAT_DIALOG_DATA);
  readonly fb = inject(FormBuilder);

  readonly form = signal<FormGroup<BookingFormControls> | undefined>(undefined);

  ngOnInit(): void {
    const {
      id,
      from,
      to,
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
      startTime,
      duration,
      days,
    } = this.booking || {};

    const form = this.fb.group<BookingFormControls>({
      id: this.fb.control(id),
      from: this.fb.control(from),
      to: this.fb.control(to),
      timezone: this.fb.control(timezone),
      startTime: this.fb.control(startTime),
      duration: this.fb.control(duration),
      days: this.fb.control(days),
    });

    this.form.set(form);
  }

  save() {
    // Implement save logic here
  }
}
