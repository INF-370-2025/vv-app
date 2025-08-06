import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AppModule } from '../../app.module';
import { AdminInvoicesComponent } from './admin-invoices/admin-invoices.component';
import { invoice } from '../../models/invoice';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { CustomerInvoicesComponent } from './customer-invoices/customer-invoices.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [AppModule,AdminInvoicesComponent,CustomerInvoicesComponent],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.less'
})
export class InvoicesComponent {

  constructor(public auth:AuthService) {}

}
