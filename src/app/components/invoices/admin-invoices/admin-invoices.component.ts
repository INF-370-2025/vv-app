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

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [AppModule, CreateInvoiceComponent],
  templateUrl: './admin-invoices.component.html',
  styleUrl: './admin-invoices.component.less'
})
export class AdminInvoicesComponent {
  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;

  invoices: invoice[] = [];
  paid: invoice[] = [];
  unpaid: invoice[] = [];
  showCreateForm = false;
  showHelp:boolean = false;

  viewingInvoice:invoice = new invoice();
  showEditModal:boolean = false;
  editInvoiceform:FormGroup = new FormGroup({
      invoice_number: new FormControl(null, [Validators.required]),
      total: new FormControl(null, [Validators.required]),
  });
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  constructor(private apiService: ApiService,private notification:NotificationService,private supabase:SupabaseService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  viewPop(invoice: invoice) {
    if (invoice.pop) {
        // Create a temporary anchor element to trigger the download
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

  // ... rest of the existing methods remain the same ...
  showHelpModal() {
    this.showHelp = true;
  }

  openCreateForm(): void {
    this.showCreateForm = true;
  }

  handleFormClose(): void {
    this.showCreateForm = false;
  }

  loadInvoices(): void {
    this.isloading = true;
    this.apiService.get_invoices().subscribe({
      next: (response) => {
        console.log(response);
        this.invoices = ([...response] as invoice[]).sort((a,b) => b.invoice_id - a.invoice_id);
        this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
        this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.isloading = false;
      }
    });
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
  }

  searchPaid($event: any) {
    if ($event.target.value == "") {
      this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
    } else {
      this.paid = this.paid.filter(x =>
        (x.job_card?.job_card_id && x.job_card?.job_card_id == $event.target.value) ||
        (x.invoice_number && x.invoice_number.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.invoice_id && x.invoice_id == $event.target.value) ||
        (x.job_card?.quotation?.job_request?.title && x.job_card?.quotation?.job_request?.title.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name && x.job_card?.quotation?.job_request?.customer?.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.surname && x.job_card?.quotation?.job_request?.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name && x.job_card?.quotation?.job_request?.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  searchUnpaid($event: any) {
    if ($event.target.value == "") {
     this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);
    } else {
      this.unpaid = this.unpaid.filter(x =>
        (x.job_card?.job_card_id && x.job_card?.job_card_id == $event.target.value) ||
        (x.invoice_number && x.invoice_number.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.invoice_id && x.invoice_id == $event.target.value) ||
        (x.job_card?.quotation?.job_request?.title && x.job_card?.quotation?.job_request?.title.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name && x.job_card?.quotation?.job_request?.customer?.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.surname && x.job_card?.quotation?.job_request?.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name && x.job_card?.quotation?.job_request?.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  viewinvoice(invoice:invoice) {
    if (invoice.invoice_url) {
      window.open(invoice.invoice_url, '_blank');
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
}
