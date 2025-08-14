import { delivery_note } from './../../../models/delivery_notes';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service'
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CreateDeliveryNoteComponent } from '../create-delivery-note/create-delivery-note.component';
import { NotificationService } from './../../../services/notification.service';
import { AppModule } from '../../../app.module';
import { AuthService } from '../../../services/auth.service';

interface DeliveryNote {
  delivery_note_id: number;
  job_card_id: number;
  delivery_note_url: string;
}

@Component({
  selector: 'app-customer-delivery-notes',
  standalone: true,
  imports: [AppModule],
  templateUrl: './customer-delivery-notes.component.html',
  styleUrl: './customer-delivery-notes.component.less'
})
export class CustomerDeliveryNotesComponent {

  deliveryNotes: DeliveryNote[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  isDeleting: { [id: number]: boolean } = {};
  showHelpModal:boolean = false;
  isloading:boolean = false;


  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private message: NzMessageService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryNotes();
  }

  showHelp() {
  this.showHelpModal = true;
  }


loadDeliveryNotes(): void {
  this.isLoading = true;
  this.apiService.get_delivery_notes_user(this.auth.user?.user_id!).subscribe({
    next: (response) => {
      console.log(response);
      this.deliveryNotes = ([...response] as delivery_note[])
        .sort((a, b) => Number(b.delivery_note_id) - Number(a.delivery_note_id));
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load delivery notes:', err);
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


}

