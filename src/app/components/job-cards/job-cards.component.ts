import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { jobCard, jobCardStatus, pattern, quotation} from '../../models/jobCard';
import { NotificationService } from '../../services/notification.service';
import { GalleryItem, ImageItem } from 'ng-gallery';
import { JobCardViewComponent } from './job-card-view/job-card-view.component';
import { UpdateJobCardComponent } from './update-job-card/update-job-card.component';
import { CreateJobCardComponent } from './create-job-card/create-job-card.component';

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

  constructor(
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadJobCardStatuses();
    this.loadJobCards();
    this.loadPatterns();
    this.loadQuotations();
  }

  showHelpModal(){
    this.showHelp = true;
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
    this.cancelled = this.jobCards.filter(x => x.job_card_status_id === 3);
  }

  openUpdateForm(jobCard: jobCard): void {
    this.jobCardToUpdate = jobCard;
    this.showUpdateForm = true;
    this.showjobCard = false;
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



  closeUpdateForm(): void {
    this.showUpdateForm = false;
  }

  closeJobcard(): void {
    this.viewJob = undefined;
    this.showjobCard = false;
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

  viewJobCard(viewJob: jobCard): void {
    this.viewJob = viewJob;
    this.showjobCard = true;
    this.showUpdateForm = false;
  }

  viewQuotation(viewJob: jobCard): void {
    if (viewJob.quotation?.quotation_url) {
      window.open(viewJob.quotation?.quotation_url, '_blank');
    } else {
      this.notification.showError("PDF Unavailable", "Quotation PDF link is not available.");
    }
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.showJobCardView = false;
    this.showUpdateForm = false;
  }

  handleJobCardCreated(newJobCard: jobCard): void {
    this.jobCards.push(newJobCard);
    this.updateFilteredArrays();
    this.showCreateForm = false;
    this.notification.showSuccess('Success', 'Job card created successfully');
  }

    handleFormClose(): void {
    this.showCreateForm = false;
    this.showJobCardView = false;
    this.showUpdateForm = false;
  }
}
