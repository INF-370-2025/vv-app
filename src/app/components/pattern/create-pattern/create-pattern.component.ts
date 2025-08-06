import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AppModule } from '../../../app.module';
import { NotificationService } from '../../../services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface PatternPayload {
  pattern_id?: number;
  pattern_type_id: number;
  design: string;
}

@Component({
  selector: 'app-create-pattern',
  standalone: true,
  imports: [AppModule],
  templateUrl: './create-pattern.component.html',
  styleUrls: ['./create-pattern.component.less']
})
export class CreatePatternComponent {
  @Input() patternTypes: any[] = [];
  @Output() closeForm = new EventEmitter<void>();
  @Output() patternCreated = new EventEmitter<void>();

  patternForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService
  ) {
    this.patternForm = this.fb.group({
      pattern_type_id: [null, [Validators.required]],
      design: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  async submitForm(): Promise<void> {
    // Validate form
    Object.values(this.patternForm.controls).forEach(control => {
      control.markAsTouched();
    });

    if (!this.patternForm.valid) {
      this.notification.showError('Error', 'Please fill all required fields');
      return;
    }

    this.isSubmitting = true;

    const payload: PatternPayload = {
      pattern_id: 0,
      pattern_type_id: +this.patternForm.value.pattern_type_id,
      design: this.patternForm.value.design
    };

    this.apiService.create_pattern(payload).subscribe({
      next: () => {
        this.notification.showSuccess('Success', 'Pattern created successfully');
        this.patternCreated.emit();
        this.closeForm.emit();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.handleCreateError(err);
        this.isSubmitting = false;
      }
    });
  }

  private handleCreateError(err: any): void {
    console.error('Error creating pattern:', err);

    let errorMessage = 'Failed to create pattern';

    if (err.status === 404) {
      errorMessage = 'API endpoint not found (404)';
    } else if (err.status === 422 && err.error?.detail) {
      // Handle both array and object error formats
      if (Array.isArray(err.error.detail)) {
        const errorMessages = err.error.detail.map((e: any) => {
          const field = e.loc?.[e.loc.length - 1] || 'field';
          return `${field}: ${e.msg}`;
        });
        errorMessage = errorMessages.join('<br>');
      } else if (typeof err.error.detail === 'string') {
        errorMessage = err.error.detail;
      }
    } else if (err.error?.detail) {
      errorMessage = err.error.detail;
    } else if (err.message) {
      errorMessage = err.message;
    }

    this.notification.showError('Error', errorMessage);
  }

  cancel(): void {
    this.closeForm.emit();
  }
}
