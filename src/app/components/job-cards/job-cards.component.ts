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
  allMaterials: any[] = [];
  allArtisans: any[] = [];


  constructor(
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadJobCardStatuses();
    this.loadJobCards();
    this.loadPatterns();
    this.loadQuotations();
    this.loadAllMaterials(); // Add this
    this.loadAllArtisans();  // Add this
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

  // Add this method to your JobCardsComponent class
resetViews(): void {
  this.showjobCard = false;
  this.showUpdateForm = false;
  this.showCreateForm = false;
  this.showDesigns = false;
}

// Update your view methods to use this:
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
}
