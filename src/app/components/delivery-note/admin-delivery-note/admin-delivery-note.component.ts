import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CreateDeliveryNoteComponent } from '../create-delivery-note/create-delivery-note.component';
import { NotificationService } from './../../../services/notification.service';
import { AppModule } from '../../../app.module';

interface DeliveryNote {
  delivery_note_id: number;
  job_card_id: number;
  delivery_note_url: string;
}

@Component({
  selector: 'app-admin-delivery-note',
  standalone: true,
  imports: [AppModule, CreateDeliveryNoteComponent],
  templateUrl: './admin-delivery-note.component.html',
  styleUrl: './admin-delivery-note.component.less'
})
export class AdminDeliveryNoteComponent implements OnInit {
  deliveryNotes: DeliveryNote[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isDeleting: { [id: number]: boolean } = {};
  showCreateForm = false;
  showHelpModal:boolean = false;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryNotes();
  }

  showHelp() {
  this.showHelpModal = true;
  }


  loadDeliveryNotes(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.get_delivery_notes().subscribe({
      next: (response: any) => {
              console.log('Admin delivery notes response:', response);  // Add this

        if (Array.isArray(response)) {
          this.deliveryNotes = response;
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

    // Use the correct endpoint format
    this.apiService.delete_delivery_note(note.delivery_note_id).subscribe({
      next: () => {
        this.message.success('Delivery note deleted successfully');
        // Remove from local array
        this.deliveryNotes = this.deliveryNotes.filter(
          n => n.delivery_note_id !== note.delivery_note_id
        );
        this.isDeleting[note.delivery_note_id] = false;
      },
      error: (err) => {
        console.error('Error deleting delivery note:', err);

        // Show detailed error message
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
}

