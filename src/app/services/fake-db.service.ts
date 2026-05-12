import { Injectable } from '@angular/core';
import { Booking, BookingJson } from '../models/booking.model';
import { toBooking } from '../utils/booking.utils';

@Injectable({ providedIn: 'root' })
export class FakeDbService {
  private readonly key = 'bookings';

  getAll(): Booking[] {
    const raw = localStorage.getItem(this.key);
    const items: BookingJson[] = raw ? JSON.parse(raw) : [];
    return items.map(toBooking);
  }

  saveAll(items: Booking[]): void {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  add(item: Booking): void {
    const items = this.getAll();
    this.saveAll([...items, item]);
  }

  update(item: Booking): void {
    const items = this.getAll();
    this.saveAll(items.map((x) => (x.id === item.id ? item : x)));
  }

  delete(id: string): void {
    const items = this.getAll();
    this.saveAll(items.filter((x) => x.id !== id));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}
