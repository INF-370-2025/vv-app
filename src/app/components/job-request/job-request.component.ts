import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { CustomerJobRequestsComponent } from './customer-job-requests/customer-job-requests.component';
import { AdminJobRequestsComponent } from './admin-job-requests/admin-job-requests.component';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-job-request',
  standalone: true,
  imports: [AppModule, CustomerJobRequestsComponent,AdminJobRequestsComponent ],
  templateUrl: './job-request.component.html',
  styleUrl: './job-request.component.less'
})
export class JobRequestComponent implements OnInit{

  constructor(public auth:AuthService) {}

  ngOnInit() {
  }

}
