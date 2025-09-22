import { Component } from '@angular/core';
import { AppModule } from '../../../app.module';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NzUploadFile, UploadFileStatus } from 'ng-zorro-antd/upload';
import { invoice, upsertInvoice } from '../../../models/invoice';
import { quotation } from '../../../models/quotation';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [AppModule, CreateInvoiceComponent],
  templateUrl: './admin-invoices.component.html',
  styleUrl: './admin-invoices.component.less'
})
export class AdminInvoicesComponent {
  selectedTabIndex: number = 0;
  isloading: boolean = false;
  btnloading: boolean = false;

  invoices: invoice[] = [];
  paid: invoice[] = [];
  unpaid: invoice[] = [];
  originalPaid: invoice[] = []; // For filtering
  originalUnpaid: invoice[] = []; // For filtering

  showCreateForm = false;
  showHelp: boolean = false;

  passedQuoteId: number | null = null;
  passedTotal: number | null = null;

  viewingInvoice: invoice = new invoice();
  showEditModal: boolean = false;
  editInvoiceform: FormGroup = new FormGroup({
    invoice_number: new FormControl(null, [Validators.required]),
    total: new FormControl(null, [Validators.required]),
  });
  file!: NzUploadFile | undefined;
  fileList: any[] = [];

  // Filter properties
  paidFilter: string = 'all';
  paidSearchTerm: string = '';
  unpaidSearchTerm: string = '';

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private supabase: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['quoteId']) {
        this.passedQuoteId = +params['quoteId'];
        this.passedTotal = +params['total'];
        this.openCreateForm();
      }
    });
    this.loadInvoices();
  }

  get quoteIdForChild(): number | undefined {
    return this.passedQuoteId !== null ? this.passedQuoteId : undefined;
  }

  get totalAmountForChild(): number | undefined {
    return this.passedTotal !== null ? this.passedTotal : undefined;
  }

  loadInvoices(): void {
    this.isloading = true;
    this.apiService.get_invoices().subscribe({
      next: (response) => {
        console.log(response);
        this.invoices = ([...response] as invoice[]).sort((a, b) => b.invoice_id - a.invoice_id);
        this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
        this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);

        // Store original arrays for filtering
        this.originalPaid = [...this.paid];
        this.originalUnpaid = [...this.unpaid];

        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading invoices:', err);
        this.isloading = false;
      }
    });
  }

  // Filter methods for Paid tab
  applyPaidFilter(): void {
    let filtered = [...this.originalPaid];

    // Apply search filter
    if (this.paidSearchTerm) {
      const searchTerm = this.paidSearchTerm.toLowerCase();
      filtered = filtered.filter(x =>
        (x.invoice_number && x.invoice_number.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.title && x.job_card.quotation.job_request.title.toLowerCase().includes(searchTerm)) ||
        (x.direct_quote?.job_request?.title && x.direct_quote.job_request.title.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name && x.job_card.quotation.job_request.customer.company_name.toLowerCase().includes(searchTerm)) ||
        (x.direct_customer?.company_name && x.direct_customer.company_name.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name && x.job_card.quotation.job_request.customer.user.name.toLowerCase().includes(searchTerm)) ||
        (x.direct_customer?.user?.name && x.direct_customer.user.name.toLowerCase().includes(searchTerm))
      );
    }

    // Apply radio filter
    if (this.paidFilter === 'withJobCard') {
      filtered = filtered.filter(x => x.job_card_id !== null && x.job_card_id !== undefined);
    } else if (this.paidFilter === 'withoutJobCard') {
      filtered = filtered.filter(x => !x.job_card_id);
    }

    this.paid = filtered;
  }

  getFilteredPaidInvoices(): invoice[] {
    return this.paid;
  }

  // Filter methods for Unpaid tab
  applyUnpaidFilter(): void {
    let filtered = [...this.originalUnpaid];

    if (this.unpaidSearchTerm) {
      const searchTerm = this.unpaidSearchTerm.toLowerCase();
      filtered = filtered.filter(x =>
        (x.invoice_number && x.invoice_number.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.title && x.job_card.quotation.job_request.title.toLowerCase().includes(searchTerm)) ||
        (x.direct_quote?.job_request?.title && x.direct_quote.job_request.title.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name && x.job_card.quotation.job_request.customer.company_name.toLowerCase().includes(searchTerm)) ||
        (x.direct_customer?.company_name && x.direct_customer.company_name.toLowerCase().includes(searchTerm)) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name && x.job_card.quotation.job_request.customer.user.name.toLowerCase().includes(searchTerm)) ||
        (x.direct_customer?.user?.name && x.direct_customer.user.name.toLowerCase().includes(searchTerm))
      );
    }

    this.unpaid = filtered;
  }

  getFilteredUnpaidInvoices(): invoice[] {
    return this.unpaid;
  }

  // Rest of your existing methods remain the same...
  openCreateForm(quoteId?: number): void {
    this.showCreateForm = true;
    if (quoteId) {
      this.passedQuoteId = quoteId;
    }
  }

  viewPop(invoice: invoice) {
    if (invoice.pop) {
      const link = document.createElement('a');
      link.href = invoice.pop;
      link.target = '_blank';
      link.download = `POP_${invoice.invoice_number || invoice.invoice_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.notification.showError("Proof of Payment not available.");
    }
  }

  showHelpModal() {
    this.showHelp = true;
  }

  handleFormClose(): void {
    this.showCreateForm = false;
    this.passedQuoteId = null;
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true
    });
  }

  selectedTabChange(index: number) {
    this.selectedTabIndex = index;
    // Reset filters when switching tabs
    if (index === 0) { // Unpaid tab
      this.unpaidSearchTerm = '';
      this.unpaid = [...this.originalUnpaid];
    } else if (index === 1) { // Paid tab
      this.paidSearchTerm = '';
      this.paidFilter = 'all';
      this.paid = [...this.originalPaid];
    }
  }

  // ... rest of your existing methods (viewinvoice, editinvoice, etc.) ...


  viewinvoice(invoice: invoice) {
    const invoiceUrl = invoice.invoice_url ||
                      (invoice.job_card?.quotation?.quotation_url); // fallback to quote URL if needed

    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      this.notification.showError("PDF link is not available.");
    }
  }

  editinvoice(invoice:invoice) {
    this.viewingInvoice = invoice;
    this.editInvoiceform.controls['invoice_number'].setValue(this.viewingInvoice.invoice_number);
    this.editInvoiceform.controls['total'].setValue(this.viewingInvoice.total);

    this.fileList = [];
    if(this.viewingInvoice.invoice_url){
      const uploadFile = {
        uid: String(this.viewingInvoice.invoice_id),
        name: String(this.viewingInvoice.invoice_url),
        status: 'done' as UploadFileStatus,
        url: this.viewingInvoice.invoice_url,
        thumbUrl: this.viewingInvoice.invoice_url,
      };
      this.fileList.push(uploadFile);
      this.file = this.fileList[0];
    }
    this.showEditModal = true;
  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    this.file = this.fileList[0];
    return false;
  };

  removeFile() {
    return (file: NzUploadFile): boolean => {
    this.fileList = [];
    this.file = undefined;
    return true;
    }
  }

  async submitEditInvoice() {
    this.btnloading = true;
    const file_url = null;
    if(this.file) {
      const file_url = await this.supabase.uploadFileToStorage(this.file!,"invoices");
    }

    if(!this.editInvoiceform.valid) {
        Object.values(this.editInvoiceform.controls).forEach(control => {
            if (control.invalid) {
              control.markAsDirty();
              control.updateValueAndValidity({ onlySelf: true });
            }
      });
    } else {
        let invoiceToInsert = new upsertInvoice();
        invoiceToInsert.total = this.editInvoiceform.value.total_cost;
        invoiceToInsert.invoice_url = file_url || this.viewingInvoice.invoice_url;
        invoiceToInsert.invoice_number = this.editInvoiceform.value.quotation_number;
        invoiceToInsert.invoice_status_id = 1;
        this.apiService.update_quotation(this.viewingInvoice.invoice_id,invoiceToInsert).subscribe({
        next: res => {
          this.showEditModal = false;
          this.loadInvoices();
          this.btnloading = false;
        },
        error: (error) => {
          this.notification.showError("An Error Occoured while processing your request");
          this.btnloading = false;
        }
      });
    }
  }

  updateInvoiceStatus(invoice: any) {
    this.btnloading = true;

    this.apiService.update_invoice_status(invoice.invoice_id).subscribe({
      next: res => {
        this.notification.showSuccess("Invoice marked as paid");
        this.loadInvoices();
        this.btnloading = false;
      },
      error: (error) => {
        this.notification.showError("Failed to update invoice status");
        this.btnloading = false;
      }
    });
  }

  createJobCard(invoice: any): void {
    if (invoice.quote_id) {
      this.router.navigate(['/job-cards'], {
        queryParams: {
          quotationId: invoice.quote_id,
          invoiceId: invoice.invoice_id
        }
      });
    } else {
      this.notification.showError('Cannot create job card: No quotation associated with this invoice');
    }
  }


}
