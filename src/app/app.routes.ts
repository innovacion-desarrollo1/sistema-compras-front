import { Routes } from '@angular/router';
import { SuggestionsDashboard } from './modules/order-suggestions/components/containers/suggestions-dashboard/suggestions-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/order-suggestions', pathMatch: 'full' },
  { path: 'order-suggestions', component: SuggestionsDashboard },
];
