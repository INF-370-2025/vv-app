import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [AppModule],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.less'
})
export class PaymentCancelComponent implements OnInit {

  invoiceId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get invoice ID from query parameters if available
    const invoiceIdParam = this.route.snapshot.queryParamMap.get('invoice_id');
    if (invoiceIdParam) {
      this.invoiceId = parseInt(invoiceIdParam);
    }
  }

  goToInvoices() {
    this.router.navigate(['/invoices']);
  }

  retryPayment() {
    if (this.invoiceId) {
      this.router.navigate(['/invoices'], {
        queryParams: {
          retry_payment: true,
          invoice_id: this.invoiceId
        }
      });
    } else {
      this.router.navigate(['/invoices']);
    }
  }
}
