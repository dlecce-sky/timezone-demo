import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FakeDbService {
  private readonly key = 'bookings';

  getAll<T>(): T[] {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : [];
  }

  saveAll<T>(items: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  add<T extends { id: string }>(item: T): void {
    const items = this.getAll<T>();
    this.saveAll([...items, item]);
  }

  update<T extends { id: string }>(item: T): void {
    const items = this.getAll<T>();
    this.saveAll(items.map((x) => (x.id === item.id ? item : x)));
  }

  delete(id: string): void {
    const items = this.getAll<{ id: string }>();
    this.saveAll(items.filter((x) => x.id !== id));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}
