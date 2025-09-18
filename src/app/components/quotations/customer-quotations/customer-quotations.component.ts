import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { RouterLink, Router } from '@angular/router';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { quotation } from '../../../models/quotation';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-customer-quotations',
  standalone: true,
  imports: [AppModule, RouterLink],
  templateUrl: './customer-quotations.component.html',
  styleUrl: './customer-quotations.component.less'
})
export class CustomerQuotationsComponent implements OnInit {

  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;
  showHelpModal = false;

  quotations: any[] = []; // Change to any[] to handle the additional property
  accepted: any[] = [];
  pending: any[] = [];
  rejected: any[] = [];

  viewingQuotation:quotation = new quotation();
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  constructor(
    private apiService: ApiService,
    private notification:NotificationService,
    private supabase:SupabaseService,
    private auth:AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuotations();
  }

  openHelpModal(): void {
    this.showHelpModal = true;
  }

  loadQuotations(): void {
    this.isloading = true;
    this.apiService.get_quotations_user(this.auth.user?.user_id!).subscribe({
      next: (response) => {
        // Map the response to include has_invoice
        if (Array.isArray(response)) {
          this.quotations = response.map(item => ({
            ...item,
            quotation_status: item.quotation_status,
            job_request: item.job_request_details,
            has_invoice: item.has_invoice
          }));
        }
        else if (response && Array.isArray(response.data)) {
          this.quotations = response.data.map((item: any) => ({
            ...item,
            quotation_status: item.quotation_status,
            job_request: item.job_request_details,
            has_invoice: item.has_invoice
          }));
        }
        else {
          console.error('Unexpected response format:', response);
          this.quotations = [];
        }

        // Sort and filter
        this.quotations.sort((a, b) => b.quotation_id - a.quotation_id);
        this.pending = this.quotations.filter(x => x.quotation_status?.quotation_status_id === 1);
        this.accepted = this.quotations.filter(x => x.quotation_status?.quotation_status_id === 2);
        this.rejected = this.quotations.filter(x => x.quotation_status?.quotation_status_id === 3);

        this.isloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.isloading = false;
      }
    });
  }

  // Add viewInvoice method
  viewInvoice(quote: any): void {
    this.router.navigate(['/invoices'], {
      queryParams: {
        quoteId: quote.quotation_id
      }
    });
  }

  getContactInfo(quote: quotation): string {
    try {
      // Safely navigate through the nested structure
      const user = quote.job_request?.customer?.user;
          console.error(quote.job_request?.customer?.user);


      if (!user) return '-';

      const name = user.name ? user.name.trim() : '';
      const surname = user.surname ? user.surname.trim() : '';
      const phone = user.phone_number ? user.phone_number.trim() : '';

      // Combine name and surname if both exist
      const fullName = [name, surname].filter(Boolean).join(' ');

      // Return formatted contact info
      if (fullName && phone) return `${fullName} | ${phone}`;
      if (fullName) return fullName;
      if (phone) return phone;

      return '-';
    } catch (e) {
      console.error('Error getting contact info:', e);
      return '-';
    }
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
  }

  searchPending($event:any) {
    if($event.target.value == "")
    {
      this.pending = this.quotations.filter(x=> x.quotation_status?.quotation_status_id == 1);
    }
    else
    {
      this.pending = this.pending.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.quotation_number && x.quotation_number.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.quotation_id && x.quotation_id == $event.target.value) ||
        (x.job_request?.title && x.job_request?.title.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.name && x.job_request?.customer?.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.surname && x.job_request?.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.company_name && x.job_request?.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  searchAccepted($event: any) {
    if ($event.target.value == "") {
      this.accepted = this.quotations.filter(x => x.quotation_status?.quotation_status_id == 2);
    } else {
      this.accepted = this.accepted.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.quotation_number && x.quotation_number.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.quotation_id && x.quotation_id == $event.target.value) ||
        (x.job_request?.title && x.job_request?.title.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.name && x.job_request?.customer?.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.surname && x.job_request?.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.company_name && x.job_request?.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  searchRejected($event: any) {
    if ($event.target.value == "") {
    this.rejected = this.quotations.filter(x=> x.quotation_status?.quotation_status_id == 3);
    } else {
      this.rejected = this.rejected.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.quotation_number && x.quotation_number.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.quotation_id && x.quotation_id == $event.target.value) ||
        (x.job_request?.title && x.job_request?.title.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.name && x.job_request?.customer?.user?.name.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.user?.surname && x.job_request?.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.job_request?.customer?.company_name && x.job_request?.customer?.company_name.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  viewQuote(quote:quotation) {
    if (quote.quotation_url) {
      window.open(quote.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF link is not available.");
    }
  }

  acceptQuotation(quote_id:number) {
    this.btnloading = true;
    this.apiService.accept_quote(quote_id).subscribe({
      next: (response) => {
        this.loadQuotations();
        this.btnloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.btnloading = false;
      }
    });
  }

  rejectQuotation(quote_id:number) {
    this.btnloading = true;
    this.apiService.reject_quote(quote_id).subscribe({
      next: (response) => {
        this.loadQuotations();
        this.btnloading = false;
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.btnloading = false;
      }
    });
  }

}
