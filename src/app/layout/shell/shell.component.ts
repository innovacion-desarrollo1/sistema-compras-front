import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SidenavStateService } from '../../core/services/sidenav-state.service';
import { SidenavComponent } from '../sidenav/sidenav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MatSidenavModule, RouterOutlet, SidenavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected navState = inject(SidenavStateService);
  private bpo = inject(BreakpointObserver);

  isHandset = toSignal(
    this.bpo
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map(r => r.matches)),
    { initialValue: false }
  );

  sidenavMode = computed(() => (this.isHandset() ? ('over' as const) : ('side' as const)));
  sidenavOpened = computed(() =>
    this.isHandset() ? this.navState.mobileOpen() : true
  );
}
