import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BookingsComponent } from './components/bookings.component';

@Component({
  selector: 'app-root',
  imports: [BookingsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
