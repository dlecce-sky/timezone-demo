import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Booking, BookingFormControls, BookingFormValue } from '../models/booking.model';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DatetimePickerComponent, DatetimePickerToggleComponent } from '@sky-it-common/sky-ui';
import { TimelinePreviewComponent } from './timeline-preview.component';
import { mapToUtcBooking } from '../utils/booking.utils';

@Component({
  selector: 'app-booking-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DatetimePickerComponent,
    DatetimePickerToggleComponent,
    TimelinePreviewComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ booking ? 'Edit' : 'New' }} Booking</h2>

    <mat-dialog-content class="mat-typography">
      @if (form(); as form) {
        <div class="content">
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

          <app-timeline-preview [booking]="previewValue()" />
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: `
    .content {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    mat-form-field {
      flex: 1 1 220px;
      min-width: 0;
    }
  `,
})
export class BookingDialogComponent implements OnInit {
  readonly booking = inject<Booking | null>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<BookingDialogComponent>);
  readonly fb = inject(FormBuilder);
  readonly destroyRef = inject(DestroyRef);

  readonly form = signal<FormGroup<BookingFormControls> | undefined>(undefined);
  readonly previewValue = signal<BookingFormValue | null>(null);

  ngOnInit(): void {
    const {
      id = crypto.randomUUID(),
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
    this.previewValue.set(form.getRawValue());

    form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.previewValue.set(form.getRawValue());
    });
  }

  save() {
    const form = this.form();
    if (form) {
      const utcBooking = mapToUtcBooking(form.getRawValue());
      this.dialogRef.close(utcBooking);
    }
  }
}
