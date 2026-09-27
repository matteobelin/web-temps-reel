import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Role, type Role as RoleType } from 'shared';
import { AuthService } from '../../data-access/auth.service';
import { formatApiError } from '../../utils/auth-error';
import { ToastService } from '../../../../core/ui/toast/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: '../../components/auth-form.html',
  styleUrl: '../../components/auth-form.scss',
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly mode: 'login' | 'register' = 'register';
  readonly roles = Object.values(Role);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    matricule: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    restaurantCode: ['', Validators.required],
    role: this.formBuilder.nonNullable.control<RoleType>(Role.WAITER, {
      validators: Validators.required,
    }),
  });
  isSubmitting = false;

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Renseignez correctement tous les champs.');
      return;
    }

    this.isSubmitting = true;
    this.authService.register(this.form.getRawValue()).subscribe({
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
