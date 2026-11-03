import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { of, throwError } from "rxjs";
import { RegisterComponent } from "./register.component";
import { AuthService } from "../../data-access/auth.service";
import { ToastService } from "../../../../core/ui/toast/toast.service";

describe("RegisterComponent", () => {
  const auth = { register: vi.fn(), setUser: vi.fn() };
  const toast = { error: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
  });

  it("registers a valid user and navigates to the dashboard", async () => {
    const user = { id: 2, matricule: "B002" };
    auth.register.mockReturnValue(of(user));
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: "Bob",
      matricule: "B002",
      password: "password123",
      restaurantCode: "PARIS",
      role: "WAITER",
    });

    await fixture.componentInstance.submit();

    expect(auth.register).toHaveBeenCalledWith(fixture.componentInstance.form.getRawValue());
    expect(auth.setUser).toHaveBeenCalledWith(user);
    expect(router.navigate).toHaveBeenCalledWith(["/dashboard"]);
  });

  it("shows registration errors and stops submitting", async () => {
    auth.register.mockReturnValue(throwError(() => ({ error: { message: "Matricule déjà utilisé" } })));
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.form.setValue({
      name: "Bob",
      matricule: "B002",
      password: "password123",
      restaurantCode: "PARIS",
      role: "WAITER",
    });

    await fixture.componentInstance.submit();

    expect(toast.error).toHaveBeenCalledWith("Matricule déjà utilisé");
    expect(fixture.componentInstance.isSubmitting).toBe(false);
  });
});
