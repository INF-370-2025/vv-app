import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { jobCard, jobCardStatus, pattern, quotation} from '../../models/jobCard';
import { NotificationService } from '../../services/notification.service';
import { GalleryItem, ImageItem } from 'ng-gallery';
import { JobCardViewComponent } from './job-card-view/job-card-view.component';
import { UpdateJobCardComponent } from './update-job-card/update-job-card.component';
import { CreateJobCardComponent } from './create-job-card/create-job-card.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-cards',
  standalone: true,
  imports: [AppModule, JobCardViewComponent, UpdateJobCardComponent, CreateJobCardComponent],
  templateUrl: './job-cards.component.html',
  styleUrls: ['./job-cards.component.less']
})
export class JobCardsComponent implements OnInit {
  jobCards: jobCard[] = [];
  pending: jobCard[] = [];
  inProgress: jobCard[] = [];
  completed: jobCard[] = [];
  cancelled: jobCard[] = [];
  isloading: boolean = false;
  showjobCard: boolean = false;
  viewJob?: jobCard;
  viewingImages: GalleryItem[] = [];
  showDesigns: boolean = false;
  showUpdateForm: boolean = false;
  showCreateForm: boolean = false;
  showJobCardView: boolean = false;
  jobCardToUpdate: jobCard | null = null;   jobCardStatuses: jobCardStatus[] = [];
  patterns: pattern[] = []; //
  quotations: quotation[] = [];
  showHelp:boolean = false;
  allMaterials: any[] = [];
  allArtisans: any[] = [];
  completedDates: { [key: number]: Date | null | 'loading' } = {};


  deliveryNoteJobCardIds: Set<number> = new Set();
  completedFilter: string = 'all';
  originalCompleted: jobCard[] = [];
  searchTerm: string = '';
  deliveryNotesLoading: boolean = true;


  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private modal: NzModalService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef


  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['quotationId'] && params['invoiceId']) {
        this.openCreateForm();
      }
    });
    this.loadJobCardStatuses();
    this.loadJobCards();
    this.loadPatterns();
    this.loadQuotations();
    this.loadAllMaterials();
    this.loadAllArtisans();
    this.loadDeliveryNotes();
  }

  isDate(obj: any): boolean {
    return obj instanceof Date;
  }

  loadDeliveryNotes(): void {
    this.deliveryNotesLoading = true;
    this.apiService.get_delivery_notes().subscribe({
      next: (response: any[]) => {
        const jobCardIds = response.map(note => note.job_card_id);
        this.deliveryNoteJobCardIds = new Set(jobCardIds);
        this.deliveryNotesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading delivery notes:', err);
        this.deliveryNotesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasDeliveryNote(jobCardId: number): boolean {
    return this.deliveryNoteJobCardIds.has(jobCardId);
  }



  fetchCompletedDate(job: jobCard): void {
    if (this.completedDates[job.job_card_id] !== undefined) return;

    this.completedDates[job.job_card_id] = 'loading';

    this.apiService.get_job_update_card(job.job_card_id).subscribe({
      next: (res) => {
        this.completedDates[job.job_card_id] = res.completed_at
          ? new Date(res.completed_at)
          : null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.completedDates[job.job_card_id] = null;
        this.cdr.detectChanges();
      }
    });
  }

  showHelpModal(){
    this.showHelp = true;
  }


    loadAllMaterials(): void {
    this.apiService.get_materials().subscribe({
      next: (res) => {
        this.allMaterials = res;
      },
      error: (err) => {
        console.error('Error loading materials:', err);
        this.notification.showError('Error', 'Failed to load materials');
      }
    });
  }

  loadAllArtisans(): void {
    this.apiService.get_artisans().subscribe({
      next: (res) => {
        this.allArtisans = res;
      },
      error: (err) => {
        console.error('Error loading artisans:', err);
        this.notification.showError('Error', 'Failed to load artisans');
      }
    });
  }

  loadJobCardStatuses(): void {
    this.apiService.get_job_card_statuses().subscribe({
      next: (response) => {
        this.jobCardStatuses = response as jobCardStatus[];
      },
      error: (err) => {
        console.error('Error loading job card statuses:', err);
        this.notification.showError('Error', 'Failed to load job card statuses');
      }
    });
  }

  loadPatterns(): void {
    this.apiService.get_patterns().subscribe({
      next: (response) => {
        this.patterns = response as pattern[];
      },
      error: (err) => {
        console.error('Error loading patterns:', err);
        this.notification.showError('Error', 'Failed to load patterns');
      }
    });
  }

  loadQuotations(): void {
    this.apiService.get_quotations().subscribe({
      next: (response) => {
        this.quotations = response as quotation[]; // Fixed variable name
      },
      error: (err) => {
        console.error('Error loading quotations:', err);
        this.notification.showError('Error', 'Failed to load quotations');
      }
    });
  }

  loadJobCards(): void {
    this.isloading = true;
    this.apiService.get_job_cards().subscribe({
      next: (response) => {
        this.jobCards = [...response] as jobCard[];
        this.updateFilteredArrays();
        this.isloading = false;

        this.loadDeliveryNotes();
      },
      error: (err) => {
        console.error('Error loading job cards:', err);
        this.isloading = false;
      }
    });
  }

  updateFilteredArrays(): void {
    this.pending = this.jobCards.filter(x => x.job_card_status_id === 5);
    this.inProgress = this.jobCards.filter(x => x.job_card_status_id === 1);
    this.completed = this.jobCards.filter(x => x.job_card_status_id === 2);
    this.originalCompleted = [...this.completed];
    this.cancelled = this.jobCards.filter(x => x.job_card_status_id === 3);
  }




  handleJobCardUpdate(updatedJobCard: jobCard): void {
    const index = this.jobCards.findIndex(j => j.job_card_id === updatedJobCard.job_card_id);
    if (index !== -1) {
      this.jobCards[index] = updatedJobCard;
    }
    this.updateFilteredArrays();
    this.showUpdateForm = false;
  }

  searchJobs(event: any, statusId: number): jobCard[] {
    const value = event.target.value.toLowerCase();
    if (!value) {
      return this.jobCards.filter(x => x.job_card_status_id === statusId);
    }

    return this.jobCards
      .filter(x => x.job_card_status_id === statusId)
      .filter(x =>
        (x.job_card_id?.toString() === value) ||
        (x.quotation?.job_request?.customer?.user?.name?.toLowerCase().includes(value)) ||
        (x.quotation?.job_request?.customer?.user?.surname?.toLowerCase().includes(value)) ||
        (x.quotation?.job_request?.customer?.user?.phone_number?.includes(value))
      );
  }


  viewDesigns(viewJob: jobCard): void {
    this.viewingImages = [];
    viewJob.quotation?.job_request?.job_request_items?.forEach(image => {
      if (image.item_url) {
        this.viewingImages.push(new ImageItem({ src: image.item_url, thumb: image.item_url }));
      }
    });
    this.showDesigns = true;
  }



  viewQuotation(viewJob: jobCard): void {
    if (viewJob.quotation?.quotation_url) {
      window.open(viewJob.quotation?.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF Unavailable", "Quotation PDF link is not available.");
    }
  }



  handleJobCardCreated(newJobCard: any): void {
    // Handle the new job card creation
    // Example: refresh job cards list
    this.loadJobCards(); // You'll need to implement this
    this.showCreateForm = false;
  }

    handleFormClose(): void {
    this.showCreateForm = false;
    this.showJobCardView = false;
    this.showUpdateForm = false;
  }

  resetViews(): void {
    this.showjobCard = false;
    this.showUpdateForm = false;
    this.showCreateForm = false;
    this.showDesigns = false;
  }

  openUpdateForm(jobCard: jobCard): void {
    this.resetViews();
    this.jobCardToUpdate = jobCard;
    this.showUpdateForm = true;
  }

  viewJobCard(viewJob: jobCard): void {
    this.resetViews();
    this.viewJob = viewJob;
    this.showjobCard = true;
  }

  openCreateForm(): void {
    this.resetViews();
    this.showCreateForm = true;
  }

  closeJobcard(): void {
    this.resetViews();
    this.viewJob = undefined;
  }

  closeUpdateForm(): void {
    this.resetViews();
  }


  setJobCardInProgress(job: jobCard): void {
    this.modal.confirm({
      nzTitle: 'Set Job Card to In Progress',
      nzContent: 'Are you sure you want to mark this job as in progress?',
      nzOnOk: () => {
        this.isloading = true;
        this.apiService.update_job_card(job.job_card_id, {
          job_card_status_id: 1
        }).subscribe({
          next: (response) => {
            this.notification.showSuccess('Success', 'Job card status updated to In Progress');
            this.loadJobCards(); // Reload the job cards to reflect the change
          },
          error: (err) => {
            console.error('Error updating job card status:', err);
            this.notification.showError('Error', 'Failed to update job card status');
            this.isloading = false;
          }
        });
      }
    });
  }

  cancelJobCard(job: jobCard): void {
    this.modal.confirm({
      nzTitle: 'Cancel Job Card',
      nzContent: 'Are you sure you want to cancel this job card? This action cannot be undone.',
      nzOkText: 'Yes, Cancel',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.isloading = true;
        this.apiService.update_job_card(job.job_card_id, {
          job_card_status_id: 3
        }).subscribe({
          next: (response) => {
            this.notification.showSuccess('Cancelled', 'Job card has been cancelled');
            this.loadJobCards(); // Reload the job cards to reflect the change
          },
          error: (err) => {
            console.error('Error cancelling job card:', err);
            this.notification.showError('Error', 'Failed to cancel job card');
            this.isloading = false;
          }
        });
      }
    });
  }

  setJobCardCompleted(job: jobCard): void {
    this.modal.confirm({
      nzTitle: 'Mark Job Card as Completed',
      nzContent: 'Are you sure you want to mark this job as completed? This will notify the customer.',
      nzOnOk: () => {
        this.isloading = true;

        // Prepare update data with current date for completion
        const updateData = {
          job_card_status_id: 2,
          completed_at: new Date().toISOString()
        };

        // Update job card status
        this.apiService.update_job_card(job.job_card_id, updateData).subscribe({
          next: (response) => {
            // Send email notification
            const emailData = {
              to_email: job.quotation?.job_request?.customer?.user?.email_address,
              subject: "Order Ready For Collection",
              body: "Good day valued customer, this email is to notify you that your order is completed and ready for collection"
            };

            this.apiService.send_email(emailData).subscribe({
              next: (emailRes) => {
                this.notification.showSuccess('Completed', 'Job card marked as completed and customer notified');
                this.loadJobCards(); // Reload the job cards to reflect the change
              },
              error: (emailErr) => {
                console.error('Error sending email:', emailErr);
                this.notification.showWarning('Completed', 'Job card marked as completed but failed to send email notification');
                this.loadJobCards(); // Still reload the job cards
              }
            });
          },
          error: (err) => {
            console.error('Error updating job card status:', err);
            this.notification.showError('Error', 'Failed to update job card status');
            this.isloading = false;
          }
        });
      }
    });
  }

  createDeliveryNote(job: any): void {
    this.router.navigate(['/create-delivery-note'], {
      queryParams: {
        jobCardId: job.job_card_id
      }
    });
  }


  // fetchCompletedDate(job: jobCard): void {
  //   // Already fetching or fetched
  //   if (this.completedDates[job.job_card_id] !== undefined) return;

  //   // Mark as loading
  //   this.completedDates[job.job_card_id] = 'loading';

  //   this.apiService.get_job_update_card(job.job_card_id).subscribe({
  //     next: (res) => {
  //       this.completedDates[job.job_card_id] = res.completed_at
  //         ? new Date(res.completed_at)
  //         : null;
  //     },
  //     error: () => {
  //       this.completedDates[job.job_card_id] = null;
  //     }
  //   });
  // }

  onSearchCompletedJobs(event: any): void {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyCompletedFilter();
  }

  applyCompletedFilter(): void {
    let filtered = [...this.originalCompleted];

    if (this.searchTerm) {
      filtered = filtered.filter(x =>
        (x.job_card_id?.toString() === this.searchTerm) ||
        (x.quotation?.job_request?.customer?.user?.name?.toLowerCase().includes(this.searchTerm)) ||
        (x.quotation?.job_request?.customer?.user?.surname?.toLowerCase().includes(this.searchTerm)) ||
        (x.quotation?.job_request?.customer?.user?.phone_number?.includes(this.searchTerm))
      );
    }
    if (this.completedFilter === 'withNote') {
      filtered = filtered.filter(job => this.hasDeliveryNote(job.job_card_id));
    } else if (this.completedFilter === 'withoutNote') {
      filtered = filtered.filter(job => !this.hasDeliveryNote(job.job_card_id));
    }

    this.completed = filtered;
  }

  getFilteredCompletedJobs(): jobCard[] {
    return this.completed;
  }
}
