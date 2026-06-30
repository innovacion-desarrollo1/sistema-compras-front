import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay } from 'rxjs';
import { DuanaRole } from '../../layout/sidenav/nav-item.model';

export interface UserSession {
  userId: string;
  email: string;
  nombre: string;
  rol: DuanaRole;
  token: string;
}

const MOCK_USERS: Record<string, { nombre: string; rol: DuanaRole; password: string }> = {
  'auxiliar@duana.com':  { nombre: 'Carlos Rodríguez', rol: 'AUXILIAR_COMPRAS', password: 'aux123' },
  'jefe@duana.com':      { nombre: 'Ana Martínez',     rol: 'JEFE_COMPRAS',     password: 'jefe123' },
  'gerente@duana.com':   { nombre: 'Luis Pérez',        rol: 'GERENTE',          password: 'gerente123' },
  'admin@duana.com':     { nombre: 'Administrador',     rol: 'ADMIN',            password: 'admin123' },
};

const SESSION_KEY = 'duana_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _session = signal<UserSession | null>(this._loadSession());

  readonly session = this._session.asReadonly();

  constructor(private router: Router) {}

  login(email: string, password: string): Observable<UserSession> {
    const user = MOCK_USERS[email.toLowerCase()];
    if (!user || user.password !== password) {
      return throwError(() => new Error('Credenciales incorrectas. Verifica tu correo y contraseña.'));
    }
    const session: UserSession = {
      userId:  email.toLowerCase(),
      email:   email.toLowerCase(),
      nombre:  user.nombre,
      rol:     user.rol,
      token:   `mock-token-${email}-${Date.now()}`,
    };
    return of(session).pipe(delay(700));
  }

  setSession(session: UserSession): void {
    this._session.set(session);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* quota exceeded — session only lives in memory */ }
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this._session() !== null;
  }

  getCurrentUser(): UserSession | null {
    return this._session();
  }

  getRole(): DuanaRole | null {
    return this._session()?.rol ?? null;
  }

  hasRole(...roles: DuanaRole[]): boolean {
    const rol = this.getRole();
    return rol !== null && roles.includes(rol);
  }

  private _loadSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  }
}
