import { Component } from '@angular/core';
import { AppModule } from '../../../app.module';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { jobRequest, jobRequestItem } from '../../../models/jobRequest';
import { NotificationService } from '../../../services/notification.service';
import { Gallery, GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { BreakpointService } from '../../../services/breakpoint.service';
import { customerType } from '../../../models/user';
import { CreateQuotationComponent } from '../../quotations/create-quotation/create-quotation.component';

@Component({
  selector: 'app-admin-job-requests',
  standalone: true,
  imports: [AppModule,GalleryModule,LightboxModule,CreateQuotationComponent],
  templateUrl: './admin-job-requests.component.html',
  styleUrl: './admin-job-requests.component.less'
})
export class AdminJobRequestsComponent {

  selectedTabIndex:number = 0;
  isloading:boolean = false;
  btnloading:boolean = false;
  job_requests: jobRequest[] = [];
  pending:jobRequest[] = [];
  accepted:jobRequest[] = [];
  rejected:jobRequest[] = [];
  customer_types:customerType[] = [];

  viewingJob:jobRequest = new jobRequest();
  viewingImages: GalleryItem[] = [];
  showJobRequestModal:boolean = false;
  viewingRequestCustomerType:number | null = null;
  showQuotationModal:boolean = false;
  showJRHelp= false;


  constructor(private apiService: ApiService,public auth:AuthService,private notification:NotificationService,public breakpoint:BreakpointService,
    public gallery: Gallery,) {}

  ngOnInit() {
    this.loadJobRequests();
  }

  loadJobRequests() {
    this.isloading = true;
    this.apiService.getJobRequests().subscribe({
      next: res => {
        console.log(res);
        this.job_requests = [...(res as jobRequest[])].sort((a,b) => b.job_request_id - a.job_request_id);
        this.pending = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 1);
        this.accepted = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 2);
        this.rejected = this.job_requests.filter(x=> x.job_request_status?.job_request_status_id == 3);
        this.loadCustomerTypes();
      },
      error: (error) => {
        this.notification.showError("An Error Occoured while processing your request");
        this.isloading = false;
      }
    });
  }

  showHelpModal() {
    this.showJRHelp = true;
  }

  loadCustomerTypes() {
    try {
      this.apiService.get_customer_types().subscribe({
      next: res => {
        this.customer_types = [...(res as customerType[])]
        this.isloading = false;
      },
      error: (error) => {
        this.notification.showError("An Error Occoured while processing your request");
        this.isloading = false;
      }
    });
    } catch(error) {
      console.log(error);
      this.notification.showError("Something went wrong , Please try again later")
    }
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

  rejectJob() {
    this.btnloading = true;
    this.apiService.rejectJob(this.viewingJob.job_request_id).subscribe({
    next: res => {
      this.btnloading = false;
      this.showJobRequestModal = false;
      this.loadJobRequests();
      this.notification.showSuccess("Saved");
    },
    error: (error) => {
      this.notification.showError("An Error Occoured while processing your request");
      this.isloading = false;
      this.btnloading = false;
    }
  });

  }

  printFiles() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write('<html><head><title>Print Images</title></head><body>');

    this.viewingJob.job_request_items!.forEach((img) => {
      printWindow?.document.write(`<img src="${img.item_url}" style="width:100%;margin-bottom:20px;" />`);
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }

  acceptJob(job:number) {
    this.showQuotationModal = false;
    this.loadJobRequests();
  }

}
