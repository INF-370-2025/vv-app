import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppModule } from '../../../app.module';
import { jobCard } from '../../../models/jobCard';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { employee } from '../../../models/user';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { email } from '../../../models/general';

@Component({
  selector: 'app-job-card-view',
  standalone: true,
  imports: [AppModule],
  templateUrl: './job-card-view.component.html',
  styleUrls: ['./job-card-view.component.less']
})
export class JobCardViewComponent implements OnInit {
  @Input() job_card: jobCard = new jobCard();
  @Output() closeView = new EventEmitter<number>();

  btnLoading: boolean = false;
  materials: any[] = []; // Stores materials for display
  showMaterialModal: boolean = false;
  artisans: employee[] = [];
  showArtisanModal: boolean = false;
  completedAt: Date | null = null;

  file!: NzUploadFile | undefined;
  fileList: any[] = [];

  completionDate!: Date;
  invoiceUrl: string | null = null;

  constructor(
    private notification: NotificationService,
    public apiService: ApiService,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    this.completionDate = this.job_card.quotation?.job_request?.finish_date!;
    this.loadMaterials();
    this.loadJobCardDetails();
    this.loadInvoice();
  }

  loadInvoice() {
    if (!this.job_card.job_card_id) return;

    this.apiService.get_invoice_by_job_card(this.job_card.job_card_id).subscribe({
      next: (res: any[]) => {
        if (res && res.length > 0) {
          this.invoiceUrl = res[0].invoice_url;
        } else {
          this.invoiceUrl = null;
        }
      },
      error: (err) => {
        console.error('Error fetching invoice:', err);
        this.invoiceUrl = null;
      }
    });
  }

  loadJobCardDetails(): void {
  if (this.job_card.job_card_id) {
    this.apiService.get_job_update_card(this.job_card.job_card_id).subscribe({
      next: (res) => {
        if (res.completed_at) {
          this.completedAt = new Date(res.completed_at);
        }
      },
      error: (err) => {
        this.notification.showError('Error', 'Failed to load job card details');
      }
    });
  }
}
  loadMaterials() {
    if (this.job_card.job_card_id) {
      this.apiService.get_job_card_with_materials(this.job_card.job_card_id)
        .subscribe({
          next: (res) => {
            this.materials = res.materials || [];
          },
          error: (err) => {
            console.error('Error loading materials:', err);
            this.notification.showError('Error', 'Failed to load materials');
          }
        });
    }
  }

  beforeUpload = (file: NzUploadFile, $event: any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  openMarkCompleted() {
    this.job_card.job_card_status_id = 2;

    this.apiService.update_job_card(this.job_card.job_card_id, this.job_card).subscribe({
      next: (res) => {
        this.notification.showSuccess('Success', 'Job card updated successfully');
      },
      error: (err) => {
        console.error('Error updating job card:', err);
        if (err.error) {
          console.error('Backend error:', err.error);
        }
        this.notification.showError('Error', 'Failed to update job card');
      }
    });

    let newEmail = new email();
    newEmail.to_email = this.job_card.quotation?.job_request?.customer?.user?.email_address!;
    newEmail.subject = "Order Ready For Collection";
    newEmail.body = "Good day valued customer, this email is to notify you that your order is completed and ready for collection";

    this.apiService.send_email(newEmail).subscribe({
      next: (res) => {
        this.notification.showSuccess('Success', 'Email sent successfully');
      },
      error: (err) => {
        this.notification.showError('Error', 'Failed to send email');
        console.log(newEmail);
      }
    });
  }

  viewQuote() {
    if (this.job_card.quotation?.quotation_url) {
      window.open(this.job_card.quotation?.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF link is not available.");
    }
  }

  openProgressImages() {
    if (this.job_card.quotation?.job_request?.progress_url) {
      window.open(this.job_card.quotation.job_request.progress_url, '_blank');
    } else {
      this.notification.showError("Progress images are not available for this job.");
    }
  }

  viewInvoice() {
    if (this.invoiceUrl) {
      window.open(this.invoiceUrl, '_blank');
    } else {
      this.notification.showError('Invoice not available');
    }
  }

  viewProgressImages() {
    const progressUrl = this.job_card.quotation?.job_request?.progress_url;

    if (progressUrl) {
      // Open in a new tab
      window.open(progressUrl, '_blank');
    } else {
      this.notification.showError('No progress images available.');
    }
  }


}
