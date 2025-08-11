import { Component } from '@angular/core';
import { AppModule } from '../../../app.module';
import { quotation, upsertQuotation } from '../../../models/quotation';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { NzUploadFile, UploadFileStatus } from 'ng-zorro-antd/upload';
import { customer } from '../../../models/user';
import { user } from '../../../models/user';

@Component({
  selector: 'app-admin-quotations',
  standalone: true,
  imports: [AppModule],
  templateUrl: './admin-quotations.component.html',
  styleUrl: './admin-quotations.component.less'
})
export class AdminQuotationsComponent {

  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;


  quotations: quotation[] = [];
  accepted: quotation[] = [];
  pending: quotation[] = [];
  rejected: quotation[] = [];
  quotationStatuses: any[] = [];


  viewingQuotation:quotation = new quotation();
  showEditModal:boolean = false;
  editQuoteform:FormGroup = new FormGroup({
      quotation_number: new FormControl(null, [Validators.required]),
      deposit: new FormControl(null, [Validators.required]),
      total_cost: new FormControl(null, [Validators.required]),
      quotation_status_id: new FormControl(null, [Validators.required])
  });
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  constructor(private apiService: ApiService,private notification:NotificationService,private supabase:SupabaseService) {}

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
      next: (response) => {
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

  editQuote(quote:quotation) {
    this.viewingQuotation = quote;
    this.editQuoteform.controls['quotation_number'].setValue(this.viewingQuotation.quotation_number);
    this.editQuoteform.controls['deposit'].setValue(this.viewingQuotation.deposit);
    this.editQuoteform.controls['total_cost'].setValue(this.viewingQuotation.total_cost);
    this.editQuoteform.controls['quotation_status_id'].setValue(this.viewingQuotation.quotation_status?.quotation_status_id);

    this.fileList = [];
    if(this.viewingQuotation.quotation_url){
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

    let quoteToInsert = new upsertQuotation();
    // Add these required fields
    quoteToInsert.quotation_id = this.viewingQuotation.quotation_id;
    quoteToInsert.job_request_id = this.viewingQuotation.job_request_id;

    // Add form values
    quoteToInsert.deposit = parseFloat(this.editQuoteform.value.deposit);
    quoteToInsert.total_cost = parseFloat(this.editQuoteform.value.total_cost);
    quoteToInsert.quotation_url = newFileUrl || this.viewingQuotation.quotation_url;
    quoteToInsert.quotation_number = this.editQuoteform.value.quotation_number;
    quoteToInsert.quotation_status_id = this.editQuoteform.value.quotation_status_id;

    console.log('Updating with:', {
        id: this.viewingQuotation.quotation_id,
        data: quoteToInsert
    });

    this.apiService.update_quotation(this.viewingQuotation.quotation_id, quoteToInsert).subscribe({
        next: res => {
            this.showEditModal = false;
            this.loadQuotations();
            this.btnloading = false;
        },
        error: (error) => {
            console.error('Update error:', error);
            this.notification.showError("An Error Occurred while processing your request");
            this.btnloading = false;
        }
    });
    this.notification.showSuccess("Update successful");

}
}
