import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { SuggestionsDashboard } from './modules/order-suggestions/components/containers/suggestions-dashboard/suggestions-dashboard';
import { PlaceholderComponent } from './shared/components/placeholder/placeholder.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'order-suggestions', pathMatch: 'full' },
      { path: 'order-suggestions', component: SuggestionsDashboard },
      { path: 'approvals',    component: PlaceholderComponent },
      { path: 'centinela',   component: PlaceholderComponent },
      { path: 'traceability', component: PlaceholderComponent },
      { path: 'settings',    component: PlaceholderComponent },
    ],
  },
];
