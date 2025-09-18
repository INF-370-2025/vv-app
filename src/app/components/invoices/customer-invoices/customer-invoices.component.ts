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
import { environment } from '../../../../environments/environment';

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

  // PayFast configuration
  payFastConfig = {
    merchantId: '10041944', // Your sandbox merchant ID
    merchantKey: '0b2hpavzl2ggn', // Your sandbox merchant key
    returnUrl: `${window.location.origin}/payment-success`,
    cancelUrl: `${window.location.origin}/payment-cancel`,
    notifyUrl: `${environment.api_url}/payfast/notify`,
    processUrl: 'https://sandbox.payfast.co.za/eng/process' // Sandbox URL
  };

 constructor(
   private apiService: ApiService,
   private notification:NotificationService,
   private supabase:SupabaseService,
   private auth:AuthService
 ) {}

ngOnInit() {
  this.loadInvoices();
  this.checkPayFastReturn();
  this.checkRetryPayment();
}

  checkRetryPayment(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const retryPayment = urlParams.get('retry_payment');
    const invoiceId = urlParams.get('invoice_id');

    if (retryPayment && invoiceId) {
      // Find the invoice and trigger payment
      const invoice = this.invoices.find(inv => inv.invoice_id === parseInt(invoiceId));
      if (invoice) {
        // Small delay to ensure component is fully rendered
        setTimeout(() => {
          this.payWithPayFast(invoice);
        }, 500);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  // Check if we're returning from a PayFast payment
  checkPayFastReturn(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const invoiceId = urlParams.get('invoice_id');

    if (paymentStatus === 'COMPLETE' && invoiceId) {
      this.confirmPayFastPayment(parseInt(invoiceId));

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Confirm PayFast payment with backend
  confirmPayFastPayment(invoiceId: number): void {
    this.apiService.confirmPayFastPayment(invoiceId).subscribe({
      next: (response) => {
        this.notification.showSuccess("Payment confirmed successfully!");
        this.loadInvoices(); // Reload to update the invoice status
      },
      error: (err) => {
        console.error('Error confirming payment:', err);
        this.notification.showError("Failed to confirm payment. Please contact support.");
      }
    });
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
        this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
        this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);
        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading invoices:', err);
        this.isloading = false;
      }
    });
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
  }

// In customer-invoices.component.ts
searchPaid($event: any) {
  const searchValue = $event.target.value.toLowerCase();
  if (searchValue === "") {
    this.paid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 1);
  } else {
    this.paid = this.invoices.filter(x =>
      x.invoice_status?.invoice_status_id === 1 && (
        (x.invoice_number && x.invoice_number.toLowerCase().includes(searchValue)) ||
        // Search through job card path
        (x.job_card?.quotation?.job_request?.title &&
         x.job_card.quotation.job_request.title.toLowerCase().includes(searchValue)) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name &&
         x.job_card.quotation.job_request.customer.user.name.toLowerCase().includes(searchValue)) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name &&
         x.job_card.quotation.job_request.customer.company_name.toLowerCase().includes(searchValue)) ||
        // Search through direct customer path
        (x.direct_customer?.user?.name && x.direct_customer.user.name.toLowerCase().includes(searchValue)) ||
        (x.direct_customer?.company_name && x.direct_customer.company_name.toLowerCase().includes(searchValue)) ||
        (x.direct_customer?.user?.surname && x.direct_customer.user.surname.toLowerCase().includes(searchValue))
      )
    );
  }
}

searchUnpaid($event: any) {
  const searchValue = $event.target.value.toLowerCase();
  if (searchValue === "") {
    this.unpaid = this.invoices.filter(x => x.invoice_status?.invoice_status_id === 2);
  } else {
    this.unpaid = this.invoices.filter(x =>
      x.invoice_status?.invoice_status_id === 2 && (
        (x.invoice_number && x.invoice_number.toLowerCase().includes(searchValue)) ||
        // Search through job card path
        (x.job_card?.quotation?.job_request?.title &&
         x.job_card.quotation.job_request.title.toLowerCase().includes(searchValue)) ||
        (x.job_card?.quotation?.job_request?.customer?.user?.name &&
         x.job_card.quotation.job_request.customer.user.name.toLowerCase().includes(searchValue)) ||
        (x.job_card?.quotation?.job_request?.customer?.company_name &&
         x.job_card.quotation.job_request.customer.company_name.toLowerCase().includes(searchValue)) ||
        // Search through direct customer path
        (x.direct_customer?.user?.name && x.direct_customer.user.name.toLowerCase().includes(searchValue)) ||
        (x.direct_customer?.company_name && x.direct_customer.company_name.toLowerCase().includes(searchValue)) ||
        (x.direct_customer?.user?.surname && x.direct_customer.user.surname.toLowerCase().includes(searchValue))
      )
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

  async submitPop() {
    this.btnloading = true;

    if (this.fileList.length === 0) {
      this.notification.showError("Please select a file first");
      this.btnloading = false;
      return;
    }

    try {
      const file = this.fileList[0];
      const file_url = await this.supabase.uploadFileToStorage(file, "pop");

      this.apiService.update_invoice_pop(
        this.viewingInvoice.invoice_id,
        file_url
      ).subscribe({
        next: () => {
          this.notification.showSuccess("Proof of Payment uploaded!");
          this.showEditModal = false;
          this.loadInvoices();
          this.btnloading = false;
        },
        error: (err) => {
          console.error(err);
          this.notification.showError("Failed to update invoice");
          this.btnloading = false;
        }
      });
    } catch (error) {
      this.notification.showError("File upload failed");
      this.btnloading = false;
    }
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [file];
    return false;
  };

  editinvoice(invoice: invoice) {
    this.viewingInvoice = invoice;
    this.fileList = [];
    this.showEditModal = true;
  }

  removeFile() {
    this.fileList = [];
  }

  payWithPayFast(invoice: invoice) {
    // Get description from both possible paths
    const itemDescription = invoice.job_card?.quotation?.job_request?.title ||
                          invoice.direct_customer?.company_name + ' Invoice' ||
                          `Invoice #${invoice.invoice_number}`;

    const paymentData = {
      merchant_id: this.payFastConfig.merchantId,
      merchant_key: this.payFastConfig.merchantKey,
      return_url: `${this.payFastConfig.returnUrl}?invoice_id=${invoice.invoice_id}`,
      cancel_url: `${this.payFastConfig.cancelUrl}?invoice_id=${invoice.invoice_id}`,
      notify_url: this.payFastConfig.notifyUrl,
      m_payment_id: invoice.invoice_id.toString(),
      amount: invoice.total.toFixed(2),
      item_name: `Invoice #${invoice.invoice_number}`,
      item_description: itemDescription,
      custom_int1: invoice.invoice_id,
      custom_str1: this.auth.user?.user_id.toString() || ''
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.payFastConfig.processUrl;
    form.style.display = 'none';

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
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
}
