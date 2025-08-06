import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../app.module';
import { AdminQuotationsComponent } from './admin-quotations/admin-quotations.component';
import { AuthService } from '../../services/auth.service';
import { CustomerQuotationsComponent } from './customer-quotations/customer-quotations.component';


@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [AppModule,AdminQuotationsComponent,CustomerQuotationsComponent],
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.less']
})
export class QuotationsComponent implements OnInit{

  constructor(public auth:AuthService) {}

  ngOnInit() {
  }


}
