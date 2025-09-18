// In create-invoice.component.ts
import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AppModule } from '../../../app.module';

interface InvoicePayload {
  invoice_number: string;
  total: number;
  invoice_url: string;
  invoice_status_id: number;
  quote_id?: number;
}

@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  imports: [AppModule],
  standalone: true,
  styleUrls: ['./create-invoice.component.less']
})
export class CreateInvoiceComponent implements OnInit {
  @Input() quoteId?: number;
  @Input() totalAmount?: number;
  @Output() closeForm = new EventEmitter<void>();
  @Output() invoiceCreated = new EventEmitter<void>();

  invoiceForm: FormGroup;
  isSubmitting = false;

  // File upload
  file!: NzUploadFile | undefined;
  fileList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService
  ) {
    this.invoiceForm = this.fb.group({
      invoice_number: [null, [Validators.required, Validators.pattern(/^INV-\d+$/)]],
      total: [null, [Validators.required, Validators.min(10)]]
    });
  }

  ngOnInit(): void {
    // Set the total amount if provided
    if (this.totalAmount) {
      this.invoiceForm.patchValue({
        total: this.totalAmount
      });
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [file];
    this.file = file;
    return false;
  };

  async submitForm(): Promise<void> {
    // Validate form
    Object.values(this.invoiceForm.controls).forEach(control => {
      control.markAsTouched();
    });

    if (!this.invoiceForm.valid) {
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
        "invoices"
      );

      if (!file_url) {
        throw new Error('File upload returned no URL');
      }

      const payload: InvoicePayload = {
        invoice_number: this.invoiceForm.value.invoice_number,
        total: +this.invoiceForm.value.total,
        invoice_url: file_url,
        invoice_status_id: 2, // Default to unpaid
        quote_id: this.quoteId // Add the quote ID
      };

      this.apiService.create_invoice(payload).subscribe({
        next: () => {
          this.notification.showSuccess('Success', 'Invoice created successfully');
          this.invoiceCreated.emit();
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
      let errorMessage = 'Failed to upload invoice PDF';
      if (uploadError?.message) errorMessage += `: ${uploadError.message}`;
      this.notification.showError('Upload Error', errorMessage);
      this.isSubmitting = false;
    }
  }

  private handleCreateError(err: any): void {
    console.error('Full error response:', err);
    console.error('Error body:', err.error);

    let errorMessage = 'Failed to create invoice';

    if (err.status === 422) {
      if (err.error && err.error.detail) {
        if (Array.isArray(err.error.detail)) {
          const errorMessages = err.error.detail.map((e: any) =>
            `${e.loc ? e.loc.join('.') : 'field'}: ${e.msg}`
          );
          errorMessage = errorMessages.join('<br>');
        } else {
          errorMessage = err.error.detail;
        }
      } else {
        errorMessage = JSON.stringify(err.error);
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
