import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { NotificationService } from '../../services/notification.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CreateDeliveryNoteComponent } from './create-delivery-note/create-delivery-note.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AdminDeliveryNoteComponent } from './admin-delivery-note/admin-delivery-note.component';
import { CustomerDeliveryNotesComponent } from './customer-delivery-notes/customer-delivery-notes.component';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-delivery-note',
  standalone: true,
  imports: [AppModule, CreateDeliveryNoteComponent, AdminDeliveryNoteComponent, CustomerDeliveryNotesComponent],
  templateUrl: './delivery-note.component.html',
  styleUrls: ['./delivery-note.component.less']
})
export class DeliveryNoteComponent   {
    constructor(public auth:AuthService) {}
}
