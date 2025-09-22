// create-delivery-note.component.ts
import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AppModule } from '../../../app.module';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Router } from '@angular/router';

interface DeliveryNotePayload {
  delivery_note_id?: number;
  job_card_id: number;
  delivery_note_url: string;
}

@Component({
  selector: 'app-create-delivery-note',
  standalone: true,
  imports: [AppModule, RouterLink],
  templateUrl: './create-delivery-note.component.html',
  styleUrls: ['./create-delivery-note.component.less']
})
export class CreateDeliveryNoteComponent implements OnInit {
  @Input() jobCardId?: number;
  @Output() closeForm = new EventEmitter<void>();
  @Output() noteCreated = new EventEmitter<void>();

  deliveryNoteForm: FormGroup;
  isSubmitting = false;
  jobCardDetails: any = null;

  // File upload variables
  file!: NzUploadFile | undefined;
  fileList: any[] = [];
  isLoadingJobCardDetails: boolean = false;


  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.deliveryNoteForm = this.fb.group({
      job_card_id: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['jobCardId']) {
        this.jobCardId = +params['jobCardId'];
        this.deliveryNoteForm.patchValue({
          job_card_id: this.jobCardId
        });
        this.loadJobCardDetails(this.jobCardId);
      }
    });
  }

  loadJobCardDetails(jobCardId: number): void {
    this.isLoadingJobCardDetails = true;
    this.apiService.get_job_cards().subscribe({
      next: (jobCards) => {
        const jobCard = jobCards.find((jc: any) => jc.job_card_id === jobCardId);
        if (jobCard) {
          this.jobCardDetails = jobCard;
        } else {
          this.notification.showError('Error', 'Job card not found');
        }
        this.isLoadingJobCardDetails = false;
      },
      error: (err) => {
        console.error('Error loading job card details:', err);
        this.notification.showError('Error', 'Failed to load job card details');
        this.isLoadingJobCardDetails = false;
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
    if (!this.deliveryNoteForm.valid) {
      this.notification.showError('Error', 'Please ensure all required fields are filled');
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
    this.router.navigate(['/delivery_note']);

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
    this.router.navigate(['/delivery_note']);
  }

}
