import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppModule } from '../../app.module';
import { ApiService } from './../../services/api.service';
import { AuthService } from './../../services/auth.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { customer } from '../../models/user';
import { SupabaseService } from '../../services/supabase.service';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AppModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.less']
})
export class ProfileComponent implements OnInit, OnDestroy {
  isLoading = true;
  isuploading = false;
  btnLoading = false;
  private authSubscription?: Subscription;
  hasCustomerRecord = false;
  private hasLoaded = false;

  user?: customer;
  file?: NzUploadFile;
  fileList: NzUploadFile[] = [];
  image_url = '';
  isDeleting = false;

  customerForm = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    surname: new FormControl<string | null>(null, [Validators.required]),
    email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
    phone: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(20)]),
    companyName: new FormControl<string | null>(null, [Validators.required]),
    telephone: new FormControl<string | null>(null, [Validators.required]),
    registrationNumber: new FormControl<string | null>(null, [Validators.required]),
    vatNumber: new FormControl<string | null>(null, [Validators.required]),
    address: new FormControl<string | null>(null, [Validators.required]),
  });

  constructor(
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    public auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.auth.userSubject.pipe(
      filter(user => !!user && !!user.user_id),
      distinctUntilChanged((prev, curr) => prev?.user_id === curr?.user_id)
    ).subscribe(user => {
      if (user && user.user_id && !this.hasLoaded) {
        this.hasLoaded = true;
        this.loadDetails();
      }
    });

    if (this.auth.user && this.auth.user.user_id && !this.hasLoaded) {
      this.hasLoaded = true;
      this.loadDetails();
    } else if (!this.hasLoaded) {
      setTimeout(() => {
        if (this.auth.user && this.auth.user.user_id && !this.hasLoaded) {
          this.hasLoaded = true;
          this.loadDetails();
        } else if (!this.hasLoaded) {
          this.isLoading = false;
          this.notificationService.showError('Unable to load user information. Please try again.');
        }
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private loadDetails(): void {
    const u = this.auth.user;
    if (!u?.user_id) {
      this.isLoading = false;
      this.notificationService.showError('User not authenticated');
      return;
    }

    if ((u.role_id ?? 0) !== 6) {
      this.notificationService.showError('Only customer profiles can be viewed/edited here.');
      this.isLoading = false;
      return;
    }

    this.setInitialFormValues(u);

    this.apiService.get_profile_customer_or_null(u.user_id).subscribe({
      next: (customerData) => {
        if (customerData) {
          this.user = customerData;
          this.hasCustomerRecord = true;
          this.setDetails(customerData);
        } else {
          this.hasCustomerRecord = false;
          this.notificationService.showInfo('Please complete your company details to create your customer profile.');
        }
        this.isLoading = false;
      },
      error: (e) => {
        console.error('Error loading customer profile:', e);
        this.isLoading = false;
        this.tryCleanVersion(u.user_id);
      }
    });
  }

  private tryCleanVersion(user_id: number): void {
    this.apiService.get_profile_customer_clean(user_id).subscribe({
      next: (row) => {
        this.user = row;
        this.hasCustomerRecord = true;
        this.setDetails(row);
        this.isLoading = false;
      },
      error: (e) => {
        console.error('get_profile_customer_clean error:', e);
        const errorMessage = e.message || e.error?.message || 'Unknown error occurred';
        this.hasCustomerRecord = false;
        this.isLoading = false;
        if (errorMessage.includes('No customer found')) {
          this.notificationService.showInfo('Please complete your company details to create your customer profile.');
        }
      }
    });
  }

  private setInitialFormValues(user: any): void {
    this.image_url = user.image || '';

    this.customerForm.patchValue({
      name: user.name || '',
      surname: user.surname || '',
      email: user.email_address || '',
      phone: user.phone_number || '',
    });
  }

  private setDetails(customerData: customer): void {
    const base = customerData?.user || this.auth.user;

    this.image_url = base?.image || this.auth.user?.image || '';

    this.customerForm.patchValue({
      name: base?.name ?? '',
      surname: base?.surname ?? '',
      email: base?.email_address ?? '',
      phone: base?.phone_number ?? '',
      companyName: customerData?.company_name ?? '',
      telephone: customerData?.telephone ?? '',
      registrationNumber: customerData?.registration_number ?? '',
      vatNumber: customerData?.vat_number ?? '',
      address: customerData?.address ?? ''
    });
  }

  beforeUpload = (file: NzUploadFile, _fileList: NzUploadFile[]): boolean => {
    this.fileList = [file];
    this.file = file;
    this.uploadImage();
    return false;
  };

  async uploadImage(): Promise<void> {
    if (!this.file) return;
    try {
      this.isuploading = true;
      const file_url = await this.supabase.uploadFileToStorage(this.file, 'images');
      await this.supabase.update_profile_pic(this.auth.user?.user_id!, file_url);

      if (this.auth.user) this.auth.user.image = file_url;
      if (this.user?.user) this.user.user.image = file_url;

      this.image_url = file_url;
      this.notificationService.showSuccess('Profile picture updated.');
    } catch (e) {
      console.error('Image upload error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      this.notificationService.showError('Failed to upload image: ' + errorMessage);
    } finally {
      this.file = undefined;
      this.fileList = [];
      this.isuploading = false;
    }
  }

  submitForm(): void {
    if (!this.auth.user?.user_id) {
      this.notificationService.showError('User not authenticated');
      return;
    }

    this.markFormGroupTouched(this.customerForm);

    if (!this.customerForm.valid) {
      this.notificationService.showError('Please fill all required fields correctly');
      return;
    }

    const authUser = this.auth.user;
    const update_user_id = authUser.user_id!;
    const src = this.customerForm.value;

    // Include ALL required fields from insertUser model
    const update_user_payload = {
      role_id: authUser.role_id!,        // Required by insertUser
      title_id: authUser.title_id!,      // Required by insertUser
      name: src.name!,
      surname: src.surname!,
      email_address: src.email!,         // Required by insertUser
      phone_number: src.phone!,          // Required by insertUser
      image: this.image_url || authUser.image,
      uuid: authUser.uuid,               // Optional but included for completeness
      is_employee: authUser.is_employee  // Optional but included for completeness
    };

    console.log('Sending user update payload:', update_user_payload);

    this.btnLoading = true;

    // First update user table
    this.apiService.update_user(update_user_id, update_user_payload).subscribe({
      next: (res) => {
        console.log('User update response:', res);

        if (res?.error) {
          this.notificationService.showError('User update failed: ' + res.error);
          this.btnLoading = false;
          return;
        }

        // Update auth service with the changed fields only
        const updatedAuthUser = {
          ...authUser,
          name: src.name!,
          surname: src.surname!,
          email_address: src.email!,
          phone_number: src.phone!,
          image: this.image_url || authUser.image
        };
        this.auth.userSubject.next(updatedAuthUser);

        // Handle customer data
        this.handleCustomerData(update_user_id, src!);
      },
      error: (e) => {
        console.error('User update error:', e);

        // Handle 422 validation errors specifically
        if (e.status === 422) {
          this.handleValidationErrors(e);
        } else {
          const errorMessage = e.error?.message || e.message || 'Unknown error occurred';
          this.notificationService.showError('Failed to update personal details: ' + errorMessage);
        }

        this.btnLoading = false;
      }
    });
  }

  private handleValidationErrors(e: any): void {
    let errorMessage = 'Validation failed: ';

    if (e.error && e.error.detail) {
      // Handle array of validation errors
      if (Array.isArray(e.error.detail)) {
        const errors = e.error.detail.map((error: any) => {
          if (typeof error === 'object') {
            // Handle object validation errors (e.g., {field: "error message"})
            if (error.msg) {
              return error.msg; // Common format: {msg: "error message"}
            } else if (error.message) {
              return error.message; // Another common format
            } else if (error.loc && error.msg) {
              // Pydantic-style errors: {loc: ["field"], msg: "error"}
              return `${error.loc.join('.')}: ${error.msg}`;
            } else {
              // Try to extract field-specific errors
              const fieldErrors = Object.entries(error)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
              return fieldErrors || JSON.stringify(error);
            }
          } else if (typeof error === 'string') {
            return error;
          }
          return JSON.stringify(error);
        });
        errorMessage += errors.join(', ');
      }
      // Handle string detail
      else if (typeof e.error.detail === 'string') {
        errorMessage += e.error.detail;
      }
      // Handle object detail
      else if (typeof e.error.detail === 'object') {
        const detailErrors = Object.entries(e.error.detail)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        errorMessage += detailErrors;
      }
    }
    // Handle different error formats
    else if (e.error && typeof e.error === 'object') {
      const errors = Object.entries(e.error)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      errorMessage += errors;
    }
    else if (e.error && typeof e.error === 'string') {
      errorMessage += e.error;
    }
    else {
      errorMessage += 'Please check all fields and try again.';
    }

    this.notificationService.showError(errorMessage);
  }

  private handleCustomerData(user_id: number, src: any): void {
    const customerData = {
      company_name: src.companyName!,
      telephone: src.telephone!,
      address: src.address!,
      registration_number: src.registrationNumber!,
      vat_number: src.vatNumber!,
      user_id: user_id
    };

    if (this.hasCustomerRecord && this.user?.customer_id) {
      this.apiService.update_customer(this.user.customer_id, customerData).subscribe({
        next: (cRes) => {
          this.handleSaveResponse(cRes, 'updated');
        },
        error: (e) => {
          console.error('Customer update error:', e);
          const errorMessage = e.error?.message || e.message || 'Unknown error occurred';
          this.notificationService.showError('Failed to update company details: ' + errorMessage);
          this.btnLoading = false;
        }
      });
    } else {
      this.apiService.create_customer(customerData).subscribe({
        next: (cRes) => {
          this.handleSaveResponse(cRes, 'created');
          if (cRes?.customer_id) {
            this.user = { ...this.user, customer_id: cRes.customer_id } as customer;
            this.hasCustomerRecord = true;
          }
        },
        error: (e) => {
          console.error('Customer creation error:', e);
          const errorMessage = e.error?.message || e.message || 'Unknown error occurred';
          this.notificationService.showError('Failed to create company details: ' + errorMessage);
          this.btnLoading = false;
        }
      });
    }
  }

  private handleSaveResponse(response: any, action: string): void {
    if (response?.error) {
      const errorMessage = response.error?.message || response.error || 'Unknown error occurred';
      this.notificationService.showError('Save failed: ' + errorMessage);
    } else {
      this.notificationService.showSuccess(`Profile ${action} successfully!`);
      this.hasLoaded = false;
      this.loadDetails();
    }
    this.btnLoading = false;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  async deleteProfilePicture(): Promise<void> {
    if (!this.auth.user?.user_id) {
      this.notificationService.showError('User not authenticated');
      return;
    }

    this.isDeleting = true;

    try {
      // Call your existing update_user API with empty image
      const updatePayload = {
        image: ''  // This will be converted to NULL in the backend
      };

      this.apiService.update_user(this.auth.user.user_id, updatePayload).subscribe({
        next: (res) => {
          if (res?.error) {
            this.notificationService.showError('Failed to remove profile picture: ' + res.error);
            return;
          }

          // Update local state
          this.image_url = '';
          if (this.auth.user) this.auth.user.image = '';
          if (this.user?.user) this.user.user.image = '';

          // Clear file list
          this.fileList = [];
          this.file = undefined;

          this.notificationService.showSuccess('Profile picture removed successfully.');
          this.isDeleting = false;
        },
        error: (e) => {
          console.error('Profile picture deletion error:', e);
          const errorMessage = e.error?.message || e.message || 'Unknown error occurred';
          this.notificationService.showError('Failed to remove profile picture: ' + errorMessage);
          this.isDeleting = false;
        }
      });

    } catch (e) {
      console.error('Unexpected error:', e);
      this.notificationService.showError('An unexpected error occurred');
      this.isDeleting = false;
    }
  }

}
