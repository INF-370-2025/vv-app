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
    title: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [Validators.required]),
    surname: new FormControl(null, [Validators.required]),
    phoneNumber: new FormControl(null, [Validators.required, this.phoneNumberValidator]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    companyName: new FormControl(null, [Validators.required]),
    telephone: new FormControl(null, [Validators.required]),
    registrationNumber: new FormControl(null, [Validators.required]),
    vatNumber: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
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

  // ====================================================

  setConsent(state: boolean) {
    this.consent = state;
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

    this.isloadingBtn = true;

    // Use normalized E.164 value for submission
    const normalizedPhone = this.toE164(this.registerForm.value.phoneNumber || '');

    const customer = new addCustomer();
    customer.title_id = this.registerForm.value.title;
    customer.name = this.registerForm.value.name;
    customer.surname = this.registerForm.value.surname;
    customer.email_address = this.registerForm.value.email;
    customer.phone_number = normalizedPhone;
    customer.company_name = this.registerForm.value.companyName;
    customer.telephone = this.registerForm.value.telephone;
    customer.registration_number = this.registerForm.value.registrationNumber;
    customer.vat_number = this.registerForm.value.vatNumber;
    customer.address = this.registerForm.value.address;

    this.apiService.create_customer(customer).subscribe({
      next: res => {
        if (!res.error) {
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
