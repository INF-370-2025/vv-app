// admin-delivery-note.component.ts
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';
import { Router, ActivatedRoute } from '@angular/router';

interface DeliveryNote {
  delivery_note_id: number;
  delivery_note_created_at: string;
  delivery_note_url: string;
  job_card_id: number;
  job_card_created_at: string;
  completed_at: string;
  special_instructions?: string;
  job_card_status_id: number;
  job_card_status: {
    status: string;
  };
  pattern_id?: number;
  quotation_id?: number;
  user_id?: number;
  quotation_user?: {
    user_id: number;
    name: string;
    surname: string;
    email_address: string;
    phone_number: string;
  };
  job_request?: {
    job_request_id: number;
    title: string;
    description: string;
    finish_date: string;
    quantity: number;
    customer?: {
      customer_id: number;
      company_name: string;
      user?: {
        user_id: number;
        name: string;
        surname: string;
        email_address: string;
        phone_number: string;
        image?: string;
      };
    };
  };
}

@Component({
  selector: 'app-admin-delivery-note',
  standalone: true,
  imports: [AppModule],
  templateUrl: './admin-delivery-note.component.html',
  styleUrls: ['./admin-delivery-note.component.less']
})
export class AdminDeliveryNoteComponent implements OnInit {
  allDeliveryNotes: DeliveryNote[] = [];
  deliveryNotes: DeliveryNote[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isDeleting: { [id: number]: boolean } = {};
  showCreateForm = false;
  showHelpModal: boolean = false;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['jobCardId']) {
        this.openCreateForm();
      }
    });
    this.loadDeliveryNotes();
  }

  loadDeliveryNotes(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.get_delivery_notes().subscribe({
      next: (response: any) => {
        console.log('Delivery notes response:', response);
        if (Array.isArray(response)) {
          this.allDeliveryNotes = response;
          this.deliveryNotes = [...this.allDeliveryNotes];
        } else {
          this.errorMessage = 'Unexpected response format';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load delivery notes (${err.status})`;
        this.isLoading = false;
      }
    });
  }

  searchDeliveryNotes(event: any): void {
    const value = event.target.value.toLowerCase();

    if (!value.trim()) {
      this.deliveryNotes = [...this.allDeliveryNotes];
      return;
    }

    this.deliveryNotes = this.allDeliveryNotes.filter(note =>
      (note.delivery_note_id && note.delivery_note_id.toString().includes(value)) ||
      (this.getJobTitle(note) && this.getJobTitle(note).toLowerCase().includes(value)) ||
      (this.getJobDescription(note) && this.getJobDescription(note).toLowerCase().includes(value)) ||
      (this.getCompletedDate(note.completed_at) && this.getCompletedDate(note.completed_at).toLowerCase().includes(value)) ||
      (this.getCustomerName(note) && this.getCustomerName(note).toLowerCase().includes(value)) ||
      (this.getCustomerPhone(note) && this.getCustomerPhone(note).toLowerCase().includes(value))
    );
  }

  getCompletedDate(completedAt: string): string {
    if (!completedAt) {
      return 'N/A';
    }

    try {
      const date = new Date(completedAt);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

  getJobTitle(note: DeliveryNote): string {
    return note.job_request?.title || 'N/A';
  }

  getJobDescription(note: DeliveryNote): string {
    return note.job_request?.description || 'No description available';
  }

  getCustomerImage(note: DeliveryNote): string {
    // Check if we have customer image, otherwise use default avatar
    if (note.job_request?.customer?.user?.image) {
      return note.job_request.customer.user.image;
    }

    // Generate a default avatar based on customer name
    const name = this.getCustomerName(note);
    if (name) {
      return `https://ui-avatars.com/api/?background=17726d&color=fff&name=${encodeURIComponent(name)}`;
    }

    // Fallback to generic user icon
    return '';
  }

  getCustomerName(note: DeliveryNote): string {
    // Try to get from job_request customer first
    if (note.job_request?.customer?.user?.name) {
      const user = note.job_request.customer.user;
      return `${user.name}${user.surname ? ' ' + user.surname : ''}`;
    }

    // Fallback to quotation_user
    if (note.quotation_user) {
      return `${note.quotation_user.name}${note.quotation_user.surname ? ' ' + note.quotation_user.surname : ''}`;
    }

    return 'Unknown Customer';
  }

  getCustomerPhone(note: DeliveryNote): string {
    // Try to get from job_request customer first
    if (note.job_request?.customer?.user?.phone_number) {
      return note.job_request.customer.user.phone_number;
    }

    // Fallback to quotation_user
    if (note.quotation_user?.phone_number) {
      return note.quotation_user.phone_number;
    }

    return '';
  }

  viewDeliveryNote(note: DeliveryNote): void {
    if (note.delivery_note_url) {
      window.open(note.delivery_note_url, '_blank');
    } else {
      this.notification.showWarning('Warning', 'No delivery note URL available');
    }
  }

  deleteDeliveryNote(note: DeliveryNote): void {
    if (!confirm('Are you sure you want to delete this delivery note?')) {
      return;
    }

    this.isDeleting[note.delivery_note_id] = true;

    this.apiService.delete_delivery_note(note.delivery_note_id).subscribe({
      next: () => {
        this.notification.showSuccess('Success', 'Delivery note deleted successfully');
        // Remove from both arrays
        this.allDeliveryNotes = this.allDeliveryNotes.filter(
          n => n.delivery_note_id !== note.delivery_note_id
        );
        this.deliveryNotes = this.deliveryNotes.filter(
          n => n.delivery_note_id !== note.delivery_note_id
        );
        this.isDeleting[note.delivery_note_id] = false;
      },
      error: (err) => {
        console.error('Error deleting delivery note:', err);
        let errorMsg = 'Failed to delete delivery note';
        if (err.status === 404) {
          errorMsg = 'Delete endpoint not found (404)';
        } else if (err.error?.detail) {
          errorMsg = err.error.detail;
        }
        this.notification.showError('Error', errorMsg);
        this.isDeleting[note.delivery_note_id] = false;
      }
    });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
  }

  handleFormClose(): void {
    this.showCreateForm = false;
  }

  showHelp(): void {
    this.showHelpModal = true;
  }
}
