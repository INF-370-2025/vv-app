import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../app.module';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { BreakpointService } from '../../services/breakpoint.service';
import { NotificationService } from '../../services/notification.service';
import { SupabaseService } from '../../services/supabase.service';
import { title } from '../../models/title';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { addCustomer } from '../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [AppModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.less'
})
export class RegisterComponent implements OnInit {

  isloadingBtn: boolean = false;
  nzStep: number = 0;
  titles: title[] = [];
  termsModal: boolean = false;
  consent: boolean = false;
  showCompleteError: boolean = false;

  // Form
  registerForm: FormGroup = new FormGroup({
    title: new FormControl<number | null>(null, [Validators.required]),
    name: new FormControl<string | null>(null, [Validators.required]),
    surname: new FormControl<string | null>(null, [Validators.required]),
    phoneNumber: new FormControl<string | null>(null, [Validators.required, this.phoneNumberValidator]),
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    companyName: new FormControl<string | null>(null, [Validators.required]),
    telephone: new FormControl<string | null>(null, [Validators.required]),

    // Match Profile component behavior
    registrationNumber: new FormControl<string | null>(
      null,
      [
        Validators.required,
        Validators.pattern(/^\d{4}\/\d{6}\/\d{2}$/) // YYYY/NNNNNN/XX
      ]
    ),
    vatNumber: new FormControl<string | null>(
      null,
      [
        Validators.required,
        Validators.pattern(/^\d{10}$/) // exactly 10 digits
      ]
    ),
    address: new FormControl<string | null>(null, [Validators.required]),
  });

  constructor(
    public breakpoint: BreakpointService,
    private supabase: SupabaseService,
    private authService: AuthService,
    private notification: NotificationService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedInSubject.next(false);
    this.loadTitles();
  }

  loadTitles() {
    try {
      this.apiService.getTitles().subscribe(data => {
        this.titles = data as title[];
      });
    } catch (error) {
      console.log(error);
      this.notification.showError('Something went wrong , Please try again later');
    }
  }

  // ============ Phone helpers & validation ============

  // Accept +########, SA 0XXXXXXXXX, 27XXXXXXXXX, or generic 8–15 digits
  phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    const raw = (control.value || '').toString().trim();
    if (!raw) return null;

    // Already E.164 like +2782...
    if (/^\+\d{8,15}$/.test(raw)) return null;

    const digits = raw.replace(/\D/g, '');

    // SA local 0XXXXXXXXX (10 digits)
    if (/^0\d{9}$/.test(digits)) return null;

    // Country code without + 27XXXXXXXXX
    if (/^27\d{9}$/.test(digits)) return null;

    // Fallback: allow 8–15 digits without a plus
    if (/^\d{8,15}$/.test(digits)) return null;

    return { invalidPhone: true };
  }

  // Keep only digits and a single leading + while typing
  cleanPhoneNumber(): void {
    const ctrl = this.registerForm.get('phoneNumber');
    if (!ctrl) return;
    const v: string = (ctrl.value || '').toString();

    // remove any '+' that isn't the first char
    let cleaned = v.replace(/(?!^)\+/g, '');
    cleaned =
      cleaned[0] === '+'
        ? '+' + cleaned.slice(1).replace(/\D/g, '')
        : cleaned.replace(/\D/g, '');

    if (cleaned !== v) ctrl.setValue(cleaned, { emitEvent: false });
  }

  // Convert to E.164 (+27…) when possible
  onPhoneBlur(): void {
    const ctrl = this.registerForm.get('phoneNumber');
    if (!ctrl) return;
    const raw = (ctrl.value || '').toString().trim();
    if (!raw) return;

    const normalized = this.toE164(raw);
    if (normalized && normalized !== raw) {
      ctrl.setValue(normalized, { emitEvent: true });
    }
  }

  private toE164(raw: string): string {
    if (/^\+\d{8,15}$/.test(raw)) return raw;

    const digits = raw.replace(/\D/g, '');

    // SA local: 0XXXXXXXXX -> +27XXXXXXXXX
    if (/^0\d{9}$/.test(digits)) return '+27' + digits.slice(1);

    // Country code without +: 27XXXXXXXXX -> +27XXXXXXXXX
    if (/^27\d{9}$/.test(digits)) return '+' + digits;

    // Generic intl: add +
    if (/^\d{8,15}$/.test(digits)) return '+' + digits;

    // Could not normalize; return original
    return raw;
  }

  // ============ Reg No + VAT auto-format (match Profile) ============

  // Keep only digits (max 10) for VAT as user types, re-run validators
  onVatInput(event: Event): void {
    const ctrl = this.registerForm.get('vatNumber');
    if (!ctrl) return;

    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 10);

    if (digits !== input.value) input.value = digits;
    if (digits !== ctrl.value) {
      ctrl.setValue(digits, { emitEvent: false });
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity({ onlySelf: true });
    }
  }

  // Auto-format Registration No to YYYY/NNNNNN/XX as user types, re-run validators
  onRegNoInput(event: Event): void {
    const ctrl = this.registerForm.get('registrationNumber');
    if (!ctrl) return;

    const input = event.target as HTMLInputElement;
    const raw = (input.value || '').replace(/\D/g, '').slice(0, 12); // 4+6+2 digits

    let formatted = raw;
    if (raw.length > 4) formatted = raw.slice(0, 4) + '/' + raw.slice(4);
    if (raw.length > 10) formatted = formatted.slice(0, 11) + '/' + formatted.slice(11);

    if (formatted !== input.value) input.value = formatted;
    if (formatted !== ctrl.value) {
      ctrl.setValue(formatted, { emitEvent: false });
      ctrl.markAsDirty();
      ctrl.updateValueAndValidity({ onlySelf: true });
    }
  }

  // ====================================================

  setConsent(state: boolean) {
    this.consent = state;
  }

  goToConsent(): void {
    // Normalize any active phone input first
    this.onPhoneBlur();

    // Mark invalid fields
    if (!this.registerForm.valid) {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    // Strict verify Reg No & VAT before allowing consent step
    const regOk = /^(19|20)\d{2}\/\d{6}\/\d{2}$/.test(this.registerForm.value.registrationNumber || '');
    const vatOk = /^\d{10}$/.test(this.registerForm.value.vatNumber || '');

    if (!regOk || !vatOk) {
      this.notification.showError(
        !regOk
          ? 'Registration number must be YYYY/NNNNNN/XX (e.g. 2024/123456/07).'
          : 'VAT number must be exactly 10 digits.'
      );
      return;
    }

    this.nzStep = 1;
  }

  submitRegister() {
    // Ensure phone is normalized even if field is still focused
    this.onPhoneBlur();

    if (!this.registerForm.valid) {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    // Final strict validation (defensive)
    const reg = this.registerForm.value.registrationNumber || '';
    const vat = this.registerForm.value.vatNumber || '';

    const regStrictOk = /^(19|20)\d{2}\/\d{6}\/\d{2}$/.test(reg);
    const vatStrictOk = /^\d{10}$/.test(vat);

    if (!regStrictOk || !vatStrictOk) {
      this.notification.showError(
        !regStrictOk
          ? 'Registration number must be YYYY/NNNNNN/XX (e.g. 2024/123456/07).'
          : 'VAT number must be exactly 10 digits.'
      );
      return;
    }

    this.isloadingBtn = true;

    // Use normalized E.164 value for submission
    const normalizedPhone = this.toE164(this.registerForm.value.phoneNumber || '');

    const customer = new addCustomer();
    customer.title_id = this.registerForm.value.title as number;
    customer.name = this.registerForm.value.name!;
    customer.surname = this.registerForm.value.surname!;
    customer.email_address = this.registerForm.value.email!;
    customer.phone_number = normalizedPhone;
    customer.company_name = this.registerForm.value.companyName!;
    customer.telephone = this.registerForm.value.telephone!;
    customer.registration_number = reg;
    customer.vat_number = vat;
    customer.address = this.registerForm.value.address!;

    this.apiService.create_customer(customer).subscribe({
      next: res => {
        if (!res?.error) {
          this.notification.showSuccess('Success');
          this.registerForm.reset();
          this.nzStep = 2;
          this.showCompleteError = false;
          this.isloadingBtn = false;
        } else {
          this.notification.showError(res.error);
          this.nzStep = 2;
          this.showCompleteError = true;
          this.isloadingBtn = false;
        }
      },
      error: (error) => {
        console.log(error);
        this.notification.showError('An Error Occoured while processing your request');
        this.nzStep = 2;
        this.showCompleteError = true;
        this.isloadingBtn = false;
      }
    });
  }
}
