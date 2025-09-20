import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { AppModule } from '../../../app.module';
import { AuthService } from '../../../services/auth.service';

interface DeliveryNote {
  delivery_note_id: number;
  delivery_note_created_at: string;
  delivery_note_url: string;
  job_card_id: number;
  job_card_created_at: string;
  completed_at: string;
  date_of_collection?: string;
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
  };
}

@Component({
  selector: 'app-customer-delivery-notes',
  standalone: true,
  imports: [AppModule],
  templateUrl: './customer-delivery-notes.component.html',
  styleUrls: ['./customer-delivery-notes.component.less']
})
export class CustomerDeliveryNotesComponent implements OnInit {
  allDeliveryNotes: DeliveryNote[] = [];
  deliveryNotes: DeliveryNote[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  showHelpModal: boolean = false;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryNotes();
  }

  loadDeliveryNotes(): void {
    this.isLoading = true;
    this.apiService.get_delivery_notes_user(this.auth.user?.user_id!).subscribe({
      next: (response: any) => {
        console.log('Customer delivery notes response:', response);
        if (Array.isArray(response)) {
          this.allDeliveryNotes = response;
          this.deliveryNotes = [...this.allDeliveryNotes];
        } else {
          this.errorMessage = 'Unexpected response format';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load delivery notes:', err);
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
      (this.getCompletedDate(note.completed_at) && this.getCompletedDate(note.completed_at).toLowerCase().includes(value))
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

  viewDeliveryNote(note: DeliveryNote): void {
    if (note.delivery_note_url) {
      window.open(note.delivery_note_url, '_blank');
    } else {
      this.notification.showWarning('Warning', 'No delivery note URL available');
    }
  }

  showHelp(): void {
    this.showHelpModal = true;
  }

  getCollectedAt(createdAt: string): string {
    if (!createdAt) return 'N/A';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

}
