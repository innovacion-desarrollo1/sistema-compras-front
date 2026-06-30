import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { SuggestionsDashboard } from './modules/order-suggestions/components/containers/suggestions-dashboard/suggestions-dashboard';
import { PlaceholderComponent } from './shared/components/placeholder/placeholder.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'order-suggestions', pathMatch: 'full' },
      { path: 'order-suggestions', component: SuggestionsDashboard },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./modules/approvals/approvals-dashboard/approvals-dashboard')
            .then(m => m.ApprovalsDashboard),
      },
      { path: 'centinela',   component: PlaceholderComponent },
      { path: 'traceability', component: PlaceholderComponent },
      { path: 'settings',    component: PlaceholderComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
