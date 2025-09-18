import { customer } from './../../../models/user';
import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { RouterLink } from '@angular/router';
import { GalleryItem, Gallery, ImageItem } from 'ng-gallery';
import { insertJobRequest, jobRequest, jobRequestItem, jobRequestStatus } from '../../../models/jobRequest';
import { customerType, user } from '../../../models/user';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { BreakpointService } from '../../../services/breakpoint.service';
import { NotificationService } from '../../../services/notification.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile, UploadFileStatus } from 'ng-zorro-antd/upload';
import { SupabaseService } from '../../../services/supabase.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


@Component({
  selector: 'app-customer-job-requests',
  standalone: true,
  imports: [AppModule,RouterLink],
  templateUrl: './customer-job-requests.component.html',
  styleUrl: './customer-job-requests.component.less'
})
export class CustomerJobRequestsComponent implements OnInit {
  showCancelConfirmation = false;
  jobToCancel: jobRequest | null = null;
  isloading:boolean = false;
  selectedTabIndex:number = 0;
  btnloading:boolean = false;
  job_requests: jobRequest[] = [];
  pending:jobRequest[] = [];
  accepted:jobRequest[] = [];
  rejected:jobRequest[] = [];
  cancelled:jobRequest[] = [];
  customer_types:customerType[] = [];
  showHelpModal:boolean = false;
  minDate: string | undefined;

  viewingJob:jobRequest = new jobRequest();
  viewingImages: GalleryItem[] = [];
  showJobRequestModal:boolean = false;
  viewingRequestCustomerType:number | null = null;
  showQuotationModal:boolean = false;
  showRequestModal:boolean = false;
  file!: NzUploadFile | undefined;
  fileList :any[] = [];

  jobRequestForm: FormGroup = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    quantity: new FormControl(null, [Validators.required, Validators.min(1)]),
    description: new FormControl(null, [Validators.required]),
    finish_date: new FormControl(null, [
      Validators.required,
      this.minDateValidator()
    ]),
  });

  constructor(
    private apiService: ApiService,
    public auth: AuthService,
    private notification: NotificationService,
    public breakpoint: BreakpointService,
    public gallery: Gallery,
    private supabase: SupabaseService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.loadJobRequests();
    }, 500);
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 7);
    this.minDate = minDate.toISOString().split('T')[0];
  }

  minDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();
      const minValidDate = new Date(today);
      minValidDate.setDate(today.getDate() + 7);

      minValidDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      return selectedDate >= minValidDate ? null : { minDate: true };
    };
  }

  handleRemove = (file: NzUploadFile): boolean => {
    const index = this.fileList.indexOf(file);
    if (index > -1) {
      this.fileList.splice(index, 1);
    }
    return true;
  };

  showHelp(){
    this.showHelpModal = true;
  }

  loadJobRequests() {
    this.isloading = true;
    // Use hardcoded user ID
    this.apiService.get_job_requests_user(this.auth.user?.user_id!).subscribe({
      next: res => {
        this.job_requests =  (res as jobRequest[]).sort((a,b) => b.job_request_id - a.job_request_id);
        this.pending = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 1);
        this.accepted = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 2);
        this.rejected = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 3);
        this.cancelled = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 4);
        this.isloading = false;
      },
      error: (error) => {
        this.notification.showError("An Error Occoured while processing your request");
        this.isloading = false;
      }
    });
  }

  loadJobRequestStatuses() {

  }

  searchPending($event:any) {
      if($event.target.value == "")
      {
        this.pending = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 1);
      }
      else
      {
        this.pending = this.pending.filter(x =>
          (x.job_request_id && x.job_request_id == $event.target.value) ||
          (x.description && x.description.toLowerCase().includes($event.target.value.toLowerCase())) ||
          (x.customer?.user?.surname && x.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
          (x.customer?.user?.phone_number && x.customer?.user?.phone_number.toLowerCase().includes($event.target.value.toLowerCase()))
        );
      }
  }

  searchAccepted($event: any) {
    if ($event.target.value == "") {
      this.accepted = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 2);
    } else {
      this.accepted = this.accepted.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.description && x.description.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.surname && x.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.phone_number && x.customer?.user?.phone_number.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  searchRejected($event: any) {
    if ($event.target.value == "") {
      this.rejected = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 3);
    } else {
      this.rejected = this.rejected.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.description && x.description.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.surname && x.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.phone_number && x.customer?.user?.phone_number.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

    searchCancelled($event: any) {
    if ($event.target.value == "") {
      this.rejected = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 4);
    } else {
      this.rejected = this.rejected.filter(x =>
        (x.job_request_id && x.job_request_id == $event.target.value) ||
        (x.description && x.description.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.surname && x.customer?.user?.surname.toLowerCase().includes($event.target.value.toLowerCase())) ||
        (x.customer?.user?.phone_number && x.customer?.user?.phone_number.toLowerCase().includes($event.target.value.toLowerCase()))
      );
    }
  }

  async viewJob(job:jobRequest) {
    this.viewingJob = job;
    this.viewingRequestCustomerType = this.viewingJob.customer?.customer_type?.customer_type_id!;
    await this.setViewingImages(job.job_request_items!);
    this.showJobRequestModal = true;

  }

  setViewingImages(images: jobRequestItem[])
  {
    this.viewingImages = [];
    images.forEach(image => {
      this.viewingImages.push(new ImageItem({ src: image.item_url, thumb: image.item_url }));
    });
  }

  selectedTabChange(index:number) {
    this.selectedTabIndex = index;
  }

  openQuotation() {
    this.showJobRequestModal = false;
    this.showQuotationModal = true;
  }

  openCreateModal() {
    this.showRequestModal = true;
  }

  editRequest() {

  }

  beforeUpload = (file: NzUploadFile,$event:any): boolean => {
    this.fileList = this.fileList.concat(file);
    return false;
  };

  async createJobRequest() {

   this.btnloading = true;
   try{


    // Seed Items
    let job_request_items = [] as any[];
    for (let i = 0; i < this.fileList.length; i++) {
      const file_url = await this.supabase.uploadFileToStorage(this.fileList[i]!,"job-request-items");
      let file = new jobRequestItem();
      file.item_url  = file_url;
      job_request_items.push(file);
    }

    // Save Job Request
    let jobRequesToInsert = new insertJobRequest();
    jobRequesToInsert.customer_id = await this.supabase.get_customer_id(this.auth.user?.user_id!)	 ?? 0;
    jobRequesToInsert.title = this.jobRequestForm.value.title;
    jobRequesToInsert.quantity =  this.jobRequestForm.value.quantity;
    jobRequesToInsert.description = this.jobRequestForm.value.description;
    jobRequesToInsert.finish_date = this.jobRequestForm.value.finish_date;
    this.apiService.create_job_request(jobRequesToInsert).subscribe({
        next: async (_) => {
          let request_id = (_[0] as jobRequest).job_request_id;
          console.log(request_id);
          for(var i = 0; i < job_request_items.length; i++){
              await this.supabase.save_job_request_item(request_id,job_request_items[i].item_url);
          }
          this.showRequestModal = false;
          this.loadJobRequests();
          this.notification.showSuccess('Job request created successfully');
        },
        error: (err) => {
          console.error('Error creating job request:', err);
          this.notification.showError('Failed to create job request');
          this.btnloading = false;
        }
      });
    } catch(ex) {
       console.log(ex);
       this.notification.showError('Failed to create job request');
       this.btnloading = false;
    }
   }

    initiateCancel(job: jobRequest): void {
      this.jobToCancel = job;
      this.showCancelConfirmation = true;
    }

    confirmCancel(): void {
      if (this.jobToCancel) {
        this.cancelJobRequest(this.jobToCancel);
      }
      this.showCancelConfirmation = false;
    }

    cancelJobRequest(job: jobRequest): void {
      this.apiService.cancel_job_request(job.job_request_id).subscribe({
        next: () => {
          // Update the status object
          if (job.job_request_status) {
            job.job_request_status.job_request_status_id = 4;
            job.job_request_status.status = 'Cancelled';
          } else {
            // Create status object if it doesn't exist
            job.job_request_status = {
              job_request_status_id: 4,
              status: 'Cancelled'
            };
          }

          // Re-categorize using the status object
          this.pending = this.job_requests.filter(x =>
            x.job_request_status?.job_request_status_id === 1
          );
          this.accepted = this.job_requests.filter(x =>
            x.job_request_status?.job_request_status_id === 2
          );
          this.rejected = this.job_requests.filter(x =>
            x.job_request_status?.job_request_status_id === 3
          );
          this.cancelled = this.job_requests.filter(x =>
            x.job_request_status?.job_request_status_id === 4
          );

          this.notification.showSuccess('Job request cancelled successfully');
        },
        error: (err) => {
          console.error('Error cancelling job request:', err);
          this.notification.showError('Failed to cancel job request');
        }
      });
    }
}
