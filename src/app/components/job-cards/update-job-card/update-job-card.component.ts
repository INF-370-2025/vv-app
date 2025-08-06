import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { jobCard, jobCardStatus, pattern, quotation } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-update-job-card',
  standalone: true,
  imports: [AppModule],
  templateUrl: './update-job-card.component.html',
  styleUrls: ['./update-job-card.component.less']
})
export class UpdateJobCardComponent implements OnInit, OnChanges {
  @Input() jobCardData: jobCard | null = null; // Allow null
  @Input() jobCardStatuses: jobCardStatus[] = [];
  @Input() patterns: pattern[] = [];
  @Input() quotations: quotation[] = [];
  @Output() closeForm = new EventEmitter<void>();
  @Output() updateSuccess = new EventEmitter<jobCard>();

  jobCardForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.jobCardForm = this.fb.group({
      job_card_id: ['', Validators.required],
      pattern_id: [null, [Validators.required]],
      job_card_status_id: [null, [Validators.required]],
      quotation_id: [null, [Validators.required]],
      special_instructions: [''],
      completed_at: [null]
    });
  }

  ngOnInit(): void {
    this.populateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobCardData'] && this.jobCardData) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (this.jobCardData) {
      this.jobCardForm.patchValue({
        job_card_id: this.jobCardData.job_card_id,
        pattern_id: this.jobCardData.pattern_id,
        job_card_status_id: this.jobCardData.job_card_status_id,
        quotation_id: this.jobCardData.quotation_id,
        special_instructions: this.jobCardData.special_instructions || '',
        completed_at: this.jobCardData.completed_at
          ? new Date(this.jobCardData.completed_at)
          : null
      });
    }
  }

submitForm(): void {
  if (this.jobCardForm.valid) {
    this.isSubmitting = true;

    const formValue = this.jobCardForm.value;
    const payload = {
      job_card_id: formValue.job_card_id, // MUST INCLUDE THIS
      pattern_id: formValue.pattern_id,
      job_card_status_id: formValue.job_card_status_id,
      quotation_id: formValue.quotation_id,
      special_instructions: formValue.special_instructions,
      completed_at: formValue.completed_at
        ? new Date(formValue.completed_at).toISOString().split('T')[0] // Format as YYYY-MM-DD
        : null
    };

    console.log('Update Payload:', payload);

    this.apiService.update_job_card(formValue.job_card_id, payload).subscribe({
      next: (updatedJobCard) => {
        this.notification.showSuccess('Success', 'Job card updated successfully');
        this.updateSuccess.emit(updatedJobCard as jobCard);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error updating job card:', err);
        // ADD DETAILED ERROR LOGGING:
        if (err.error) {
          console.error('Backend error:', err.error);
        }
        this.notification.showError('Error', 'Failed to update job card');
        this.isSubmitting = false;
      }
    });
  }
}

  cancel(): void {
    this.closeForm.emit();
  }
}
