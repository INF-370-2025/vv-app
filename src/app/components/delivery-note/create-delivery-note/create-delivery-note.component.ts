import { Component, EventEmitter, Output } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AppModule } from '../../../app.module';
import { NotificationService } from '../../../services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { SupabaseService } from '../../../services/supabase.service';

interface DeliveryNotePayload {
  delivery_note_id?: number;
  job_card_id: number;
  delivery_note_url: string;
}

@Component({
  selector: 'app-create-delivery-note',
  standalone: true,
  imports: [AppModule],
  templateUrl: './create-delivery-note.component.html',
  styleUrls: ['./create-delivery-note.component.less']
})
export class CreateDeliveryNoteComponent {
  @Output() closeForm = new EventEmitter<void>();
  @Output() noteCreated = new EventEmitter<void>();
  deliveryNoteForm: FormGroup;
  isSubmitting = false;
  isLoadingJobCards = false; // Add loading state
  completedJobCards: any[] = []; // Store completed job cards

  // File upload variables
  file!: NzUploadFile | undefined;
  fileList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService
  ) {
    this.deliveryNoteForm = this.fb.group({
      job_card_id: [null, [Validators.required]] // Remove min validator
    });
  }

  ngOnInit(): void {
    this.loadCompletedJobCards();
  }

    // Load completed job cards from API
  loadCompletedJobCards(): void {
    this.isLoadingJobCards = true;
    this.apiService.get_completed_job_cards().subscribe({
      next: (jobCards) => {
        this.completedJobCards = jobCards || [];
        this.isLoadingJobCards = false;
      },
      error: (err) => {
        console.error('Error loading job cards:', err);
        this.notification.showError('Error', 'Failed to load job cards');
        this.isLoadingJobCards = false;
      }
    });
  }

  // Handle file selection
  beforeUpload = (file: NzUploadFile): boolean => {
    // Clear previous files and add new one
    this.fileList = [file];
    this.file = file;
    return false;
  };

  async submitForm(): Promise<void> {
    // Validate form
    Object.values(this.deliveryNoteForm.controls).forEach(control => {
      control.markAsTouched();
    });

    if (!this.deliveryNoteForm.valid) {
      this.notification.showError('Error', 'Please fill all required fields');
      return;
    }

    if (!this.file) {
      this.notification.showError('Error', 'Please upload a PDF file');
      return;
    }

    this.isSubmitting = true;

    try {
      const file_url = await this.supabase.uploadFileToStorage(
        this.file,
        "delivery-notes"
      );

      if (!file_url) {
        throw new Error('File upload returned no URL');
      }

      const payload: DeliveryNotePayload = {
        delivery_note_id: 0,
        job_card_id: +this.deliveryNoteForm.value.job_card_id,
        delivery_note_url: file_url
      };

      this.apiService.create_delivery_note(payload).subscribe({
        next: () => {
          this.notification.showSuccess('Success', 'Delivery note created successfully');
          this.noteCreated.emit();
          this.closeForm.emit();
          this.isSubmitting = false;
        },
        error: (err) => {
          this.handleCreateError(err);
          this.isSubmitting = false;
        }
      });
    } catch (uploadError: any) {
      console.error('Upload failed:', uploadError);

      let errorMessage = 'Failed to upload delivery note PDF';
      if (uploadError?.message === 'Bucket not found') {
        errorMessage = 'Storage bucket "delivery-notes" not found. Please contact support.';
      } else if (uploadError?.message) {
        errorMessage += `: ${uploadError.message}`;
      }

      this.notification.showError('Upload Error', errorMessage);
      this.isSubmitting = false;
    }
  }

  private handleCreateError(err: any): void {
    console.error('Error creating delivery note:', err);

    let errorMessage = 'Failed to create delivery note';

    if (err.status === 404) {
      errorMessage = 'API endpoint not found (404)';
    } else if (err.status === 422 && err.error?.detail) {
      const errorMessages = err.error.detail.map((e: any) =>
        `${e.loc?.[1] || 'field'}: ${e.msg}`
      );
      errorMessage = errorMessages.join('<br>');
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
