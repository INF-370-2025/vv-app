import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [AppModule],
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.less']
})
export class ReceiptsComponent implements OnInit {
  receipts: any[] = [];
  isLoading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.isLoading = true;
    this.apiService.get_receipts().subscribe({
      next: (response) => {
        this.receipts = response || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading receipts:', err);
        this.isLoading = false;
      }
    });
  }

}
