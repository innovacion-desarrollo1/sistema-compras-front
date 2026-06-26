import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SidenavStateService {
  private readonly STORAGE_KEY = 'duana_sidenav_collapsed';

  collapsed = signal<boolean>(localStorage.getItem(this.STORAGE_KEY) === 'true');
  mobileOpen = signal<boolean>(false);

  toggle(): void {
    this.collapsed.update(v => !v);
    localStorage.setItem(this.STORAGE_KEY, String(this.collapsed()));
  }

  toggleMobileOpen(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
