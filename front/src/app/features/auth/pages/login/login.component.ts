import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../data-access/auth.service';
import { formatApiError } from '../../utils/auth-error';
import { ToastService } from '../../../../core/ui/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: '../../components/auth-form.html',
  styleUrl: '../../components/auth-form.scss',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly mode: 'login' | 'register' = 'login';
  readonly roles = [];
  readonly form = this.formBuilder.nonNullable.group({
    matricule: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    restaurantCode: ['', Validators.required],
  });
  isSubmitting = false;

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Renseignez correctement tous les champs.');
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.authService.setUser(user);
        void this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.toast.error(formatApiError(error));
        this.isSubmitting = false;
      },
    });
  }
}
