import { Component } from '@angular/core';
import { AppModule } from '../../../app.module';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NzUploadFile, UploadFileStatus } from 'ng-zorro-antd/upload';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { invoice } from '../../../models/invoice';
import { AuthService } from '../../../services/auth.service';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-customer-invoices',
  standalone: true,
  imports: [AppModule],
  templateUrl: './customer-invoices.component.html',
  styleUrl: './customer-invoices.component.less'
})
export class CustomerInvoicesComponent {

  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;

  invoices: invoice[] = [];
  paid: invoice[] = [];
  unpaid: invoice[] = [];
  showHelpModal: boolean = false

  viewingInvoice:invoice = new invoice();
  showEditModal:boolean = false;
  editInvoiceform:FormGroup = new FormGroup({
      invoice_number: new FormControl(null, [Validators.required]),
      total: new FormControl(null, [Validators.required]),
  });
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

 constructor(private apiService: ApiService,private notification:NotificationService,private supabase:SupabaseService, private auth:AuthService) {}

  ngOnInit() {
    this.loadInvoices();
  }

  showHelp(){
    this.showHelpModal = true;
  }

  loadInvoices(): void {
    this.isloading = true;
    this.apiService.get_invoices_user(this.auth.user?.user_id!).subscribe({
      next: (response) => {
        console.log(response);
        this.invoices = ([...response] as invoice[]).sort((a,b) => b.invoice_id - a.invoice_id);
        this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);
        this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
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


}
