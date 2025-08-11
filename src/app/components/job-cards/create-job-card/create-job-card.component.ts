import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { pattern, quotation } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';

@Component({
  standalone: true,
  imports: [AppModule],
  selector: 'app-create-job-card',
  templateUrl: './create-job-card.component.html',
  styleUrls: ['./create-job-card.component.less']
})
export class CreateJobCardComponent {
  @Input() patterns: pattern[] = [];
  @Input() quotations: quotation[] = [];
  @Output() closeForm = new EventEmitter<void>();
  @Output() createSuccess = new EventEmitter<any>();

  jobCardForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.jobCardForm = this.fb.group({
      pattern_id: [null], // No longer required
      quotation_id: [null], // No longer required
      special_instructions: [''] // Still optional
    });
  }

submitForm(): void {
  this.isSubmitting = true;

  const formValue = this.jobCardForm.value;

  const payload = {
    job_card_id: 0, // Add dummy ID to satisfy backend validation
    pattern_id: formValue.pattern_id,
    quotation_id: formValue.quotation_id,
    special_instructions: formValue.special_instructions,
    job_card_status_id: 5, // Set to Pending
    completed_at: null     // Set to null as requested
  };

  this.apiService.create_job_card(payload).subscribe({
    next: (newJobCard) => {
      this.notification.showSuccess('Success', 'Job card created successfully');
      this.createSuccess.emit(newJobCard);
      this.isSubmitting = false;
      this.closeForm.emit();
    },
    error: (err) => {
      console.error('Error creating job card:', err.error); // Log detailed error
      this.notification.showError('Error', 'Failed to create job card');
      this.isSubmitting = false;
    }
  });
}

  cancel(): void {
    this.closeForm.emit();
  }
}
