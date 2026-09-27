import { Routes } from '@angular/router';
import { OrdersPageComponent } from './features/orders/pages/orders-page.component';
import { ChatPageComponent } from './features/chat/pages/chat-page.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: OrdersPageComponent },
      { path: 'chat', component: ChatPageComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
