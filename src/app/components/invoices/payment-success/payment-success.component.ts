import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [AppModule],
  templateUrl: './payment-success.component.html'
})
export class PaymentSuccessComponent implements OnInit {

  invoiceId: number = 1; // Set to 1 as requested

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    // Get invoice ID from query parameters if available, otherwise use default
    const invoiceIdParam = this.route.snapshot.queryParamMap.get('invoice_id');
    if (invoiceIdParam) {
      this.invoiceId = parseInt(invoiceIdParam);
    }

    // Confirm the payment with the backend
    this.apiService.confirmPayFastPayment(this.invoiceId).subscribe({
      next: () => {
        this.notification.showSuccess("Payment confirmed successfully!");
      },
      error: (err) => {
        console.error('Error confirming payment:', err);
        this.notification.showError("Failed to confirm payment. Please contact support.");
      }
    });
  }

  goToInvoices() {
    this.router.navigate(['/invoices']);
  }
}
