import { Routes } from '@angular/router';
import { Module1Dashboard } from './modules/modulo1/components/module1-dashboard/module1-dashboard';

export const routes: Routes = [
  { path: '', redirectTo: '/modulo1', pathMatch: 'full' },
  { path: 'modulo1', component: Module1Dashboard },
];
