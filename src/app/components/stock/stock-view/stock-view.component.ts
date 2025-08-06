import { Component, Input, Output, EventEmitter } from '@angular/core';
import { stock } from '../../../models/stock';
import { AppModule } from '../../../app.module';

@Component({
  selector: 'app-stock-view',
  standalone: true,
  imports: [AppModule],
  templateUrl: './stock-view.component.html',
  styleUrls: ['./stock-view.component.less']
})
export class StockViewComponent {
  @Input() stock_item!: stock;
  @Output() closeView = new EventEmitter<void>();

  getStockLevelColor(level: number): string {
    if (level < 50) return 'red';
    if (level < 250) return 'orange';
    return 'green';
  }

  getStockLevelStatus(level: number): string {
    if (level < 50) return 'Low Stock';
    if (level < 250) return 'Medium Stock';
    return 'High Stock';
  }
}
