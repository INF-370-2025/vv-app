import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NzUploadFile, UploadFileStatus } from 'ng-zorro-antd/upload';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AppModule } from '../../../app.module';

@Component({
  standalone: true,
  imports: [AppModule],
  selector: 'app-admin-quotations',
  templateUrl: './admin-quotations.component.html',
  styleUrls: ['./admin-quotations.component.less']
})
export class AdminQuotationsComponent {

  selectedTabIndex: number = 0;
  isloading: boolean = false;
  btnloading: boolean = false;
  showHelp: boolean = false;

  quotations: any[] = [];
  accepted: any[] = [];
  pending: any[] = [];
  rejected: any[] = [];
  quotationStatuses: any[] = [];

  viewingQuotation: any = {};
  showEditModal: boolean = false;
  editQuoteform: FormGroup = new FormGroup({
    quotation_number: new FormControl(null, [Validators.required]),
    total_cost: new FormControl(null, [Validators.required]),
    quotation_status_id: new FormControl(null, [Validators.required])
  });
  file!: NzUploadFile | undefined;
  fileList: any[] = [];
  invoiceFilter: string = 'all';
  filteredAccepted: any[] = [];

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuotations();
    this.loadQuotationStatuses();
  }

  loadQuotationStatuses(): void {
    this.apiService.get_quotation_statuses().subscribe({
      next: (response) => {
        this.quotationStatuses = response;
      },
      error: (err) => {
        console.error('Error loading quotation statuses:', err);
        this.notification.showError('Error', 'Failed to load quotation statuses');
      }
    });
  }

  loadQuotations(): void {
    this.isloading = true;

    this.apiService.get_quotations().subscribe({
      next: (response: any) => {
        this.quotations = response.map((quote: any) => ({
          ...quote,
          job_request: quote.job_request_details,
        })).sort((a: any, b: any) => b.quotation_id - a.quotation_id);

        // Filter by status
        this.pending = this.quotations.filter((x: any) => x.quotation_status?.quotation_status_id === 1);
        this.accepted = this.quotations.filter((x: any) => x.quotation_status?.quotation_status_id === 2);
        this.rejected = this.quotations.filter((x: any) => x.quotation_status?.quotation_status_id === 3);

        // Initialize filtered accepted quotations
        this.filteredAccepted = [...this.accepted];

        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.isloading = false;
      }
    });
  }

  selectedTabChange(index: number) {
    this.selectedTabIndex = index;
  }

  searchPending($event: any) {
    const searchTerm = $event.target.value.toLowerCase();
    if (!searchTerm) {
      this.pending = this.quotations.filter((x: any) => x.quotation_status?.quotation_status_id === 1);
    } else {
      this.pending = this.quotations.filter((x: any) =>
        x.quotation_status?.quotation_status_id === 1 &&
        (
          (x.quotation_number && x.quotation_number.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.title && x.job_request_details.title.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.description && x.job_request_details.description.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.user?.name && x.job_request_details.customer.user.name.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.user?.surname && x.job_request_details.customer.user.surname.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.company_name && x.job_request_details.customer.company_name.toLowerCase().includes(searchTerm))
        )
      );
    }
  }

  filterAcceptedQuotations(): void {
    switch (this.invoiceFilter) {
      case 'withInvoice':
        this.filteredAccepted = this.accepted.filter(quote => quote.has_invoice);
        break;
      case 'withoutInvoice':
        this.filteredAccepted = this.accepted.filter(quote => !quote.has_invoice);
        break;
      default:
        this.filteredAccepted = [...this.accepted];
        break;
    }
  }

  searchAccepted($event: any): void {
    const searchTerm = $event.target.value.toLowerCase();

    if (!searchTerm) {
      this.filterAcceptedQuotations();
    } else {
      this.filteredAccepted = this.filteredAccepted.filter((x: any) =>
        (x.quotation_number && x.quotation_number.toLowerCase().includes(searchTerm)) ||
        (x.job_request_details?.title && x.job_request_details.title.toLowerCase().includes(searchTerm)) ||
        (x.job_request_details?.description && x.job_request_details.description.toLowerCase().includes(searchTerm)) ||
        (x.job_request_details?.customer?.user?.name && x.job_request_details.customer.user.name.toLowerCase().includes(searchTerm)) ||
        (x.job_request_details?.customer?.user?.surname && x.job_request_details.customer.user.surname.toLowerCase().includes(searchTerm)) ||
        (x.job_request_details?.customer?.company_name && x.job_request_details.customer.company_name.toLowerCase().includes(searchTerm))
      );
    }
  }

  searchRejected($event: any) {
    const searchTerm = $event.target.value.toLowerCase();
    if (!searchTerm) {
      this.rejected = this.quotations.filter((x: any) => x.quotation_status?.quotation_status_id === 3);
    } else {
      this.rejected = this.quotations.filter((x: any) =>
        x.quotation_status?.quotation_status_id === 3 &&
        (
          (x.quotation_number && x.quotation_number.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.title && x.job_request_details.title.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.description && x.job_request_details.description.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.user?.name && x.job_request_details.customer.user.name.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.user?.surname && x.job_request_details.customer.user.surname.toLowerCase().includes(searchTerm)) ||
          (x.job_request_details?.customer?.company_name && x.job_request_details.customer.company_name.toLowerCase().includes(searchTerm))
        )
      );
    }
  }

  viewQuote(quote: any) {
    if (quote.quotation_url) {
      window.open(quote.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF link is not available.");
    }
  }

  editQuote(quote: any) {
    this.viewingQuotation = quote;
    this.editQuoteform.controls['quotation_number'].setValue(this.viewingQuotation.quotation_number);
    this.editQuoteform.controls['total_cost'].setValue(this.viewingQuotation.total_cost);
    this.editQuoteform.controls['quotation_status_id'].setValue(this.viewingQuotation.quotation_status?.quotation_status_id);

    this.fileList = [];
    if (this.viewingQuotation.quotation_url) {
      const uploadFile = {
        uid: String(this.viewingQuotation.quotation_id),
        name: String(this.viewingQuotation.quotation_url),
        status: 'done' as UploadFileStatus,
        url: this.viewingQuotation.quotation_url,
        thumbUrl: this.viewingQuotation.quotation_url,
      };
      this.fileList.push(uploadFile);
      this.file = this.fileList[0];
    }
    this.showEditModal = true;
  }

  beforeUpload = (file: NzUploadFile, $event: any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  removeFile() {
    return (file: NzUploadFile): boolean => {
      this.fileList = [];
      this.file = undefined;
      return true;
    };
  }

  async submitEditQuote() {
    this.btnloading = true;
    let newFileUrl: string | null = null;

    if (this.file) {
      try {
        newFileUrl = await this.supabase.uploadFileToStorage(this.file, "quotations");
      } catch (error) {
        this.notification.showError("File upload failed");
        this.btnloading = false;
        return;
      }
    }

    if (!this.editQuoteform.valid) {
      Object.values(this.editQuoteform.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.btnloading = false;
      return;
    }

    let quoteToInsert = {
      quotation_id: this.viewingQuotation.quotation_id,
      job_request_id: this.viewingQuotation.job_request_id,
      total_cost: parseFloat(this.editQuoteform.value.total_cost),
      quotation_url: newFileUrl || this.viewingQuotation.quotation_url,
      quotation_number: this.editQuoteform.value.quotation_number,
      quotation_status_id: this.editQuoteform.value.quotation_status_id
    };

    this.apiService.update_quotation(this.viewingQuotation.quotation_id, quoteToInsert).subscribe({
      next: (res: any) => {
        this.showEditModal = false;
        this.loadQuotations();
        this.btnloading = false;
        this.notification.showSuccess("Update successful");
      },
      error: (error: any) => {
        console.error('Update error:', error);
        this.notification.showError("An Error Occurred while processing your request");
        this.btnloading = false;
      }
    });
  }

  openHelpModal(): void {
    this.showHelp = true;
  }

  closeHelpModal(): void {
    this.showHelp = false;
  }

  createInvoice(quote: any): void {
    this.router.navigate(['/invoices'], {
      queryParams: {
        quoteId: quote.quotation_id,
        total: quote.total_cost
      }
    });
  }
}
