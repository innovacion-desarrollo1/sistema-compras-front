import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading       = signal(false);
  errorMessage  = signal<string | null>(null);
  hidePassword  = signal(true);

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.auth.login(email!, password!).subscribe({
      next: session => {
        this.auth.setSession(session);
        this.loading.set(false);
        this.router.navigate(['/order-suggestions']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMessage.set(err.message ?? 'Error al iniciar sesión. Intenta de nuevo.');
      },
    });
  }

  fillDev(email: string, password: string): void {
    this.loginForm.patchValue({ email, password });
    this.errorMessage.set(null);
  }
}
