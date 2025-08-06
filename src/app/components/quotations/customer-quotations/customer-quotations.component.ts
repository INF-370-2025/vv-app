import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { RouterLink } from '@angular/router';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { quotation } from '../../../models/quotation';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { SupabaseService } from '../../../services/supabase.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-customer-quotations',
  standalone: true,
  imports: [AppModule,RouterLink],
  templateUrl: './customer-quotations.component.html',
  styleUrl: './customer-quotations.component.less'
})
export class CustomerQuotationsComponent implements OnInit {

  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;


  quotations: quotation[] = [];
  accepted: quotation[] = [];
  pending: quotation[] = [];
  rejected: quotation[] = [];

  viewingQuotation:quotation = new quotation();
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  constructor(private apiService: ApiService,private notification:NotificationService,private supabase:SupabaseService,private auth:AuthService) {}

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.isloading = true;
    this.apiService.get_quotations_user(this.auth.user?.user_id!).subscribe({
      next: (response) => {
        console.log(this.quotations);
        this.quotations = ([...response] as quotation[]).sort((a,b) => b.quotation_id - a.quotation_id);
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
