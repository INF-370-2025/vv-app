import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AppModule } from '../../app.module';
import { stock } from '../../models/stock';
import { NotificationService } from '../../services/notification.service';
import { StockViewComponent } from './stock-view/stock-view.component';
import { CreateStockComponent } from './create-stock/create-stock.component';
import { UpdateStockComponent } from './update-stock/update-stock.component';
import { material } from '../../models/stock';
import { stock_type } from '../../models/stock';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [AppModule, StockViewComponent, CreateStockComponent, UpdateStockComponent],
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.less']
})
export class StockComponent implements OnInit {
  allStock: stock[] = [];
  lowStock: stock[] = [];
  mediumStock: stock[] = [];
  highStock: stock[] = [];
  isLoading: boolean = false;
  showStockView: boolean = false;
  showCreateView: boolean = false;
  showUpdateView: boolean = false;
  viewStockItem?: stock;
  stockToUpdate?: stock;
  materials: material [] = [];
  stockTypes: stock_type [] = [];


  constructor(
    private apiService: ApiService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStock();
  }

  loadStock(): void {
    this.isLoading = true;
    this.apiService.get_all_stock().subscribe({
      next: (response) => {
        this.allStock = response.map((item: any) => ({
          ...item.stock_details,
          stock_id: item.stock_id,
          created_at: item.created_at
        })) as stock[];

        // Categorise stock
        this.lowStock = this.allStock.filter(item => item.stock_level < 50);
        this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
        this.highStock = this.allStock.filter(item => item.stock_level >= 250);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading stock:', err);
        this.isLoading = false;
      }
    });
  }

  searchLowStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.lowStock = this.allStock.filter(item => item.stock_level < 50);
    } else {
      this.lowStock = this.lowStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value))
      );
    }
  }

  searchMediumStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
    } else {
      this.mediumStock = this.mediumStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value))
      );
    }
  }

  searchHighStock(event: any) {
    const value = event.target.value.toLowerCase();
    if (value === '') {
      this.highStock = this.allStock.filter(item => item.stock_level >= 250);
    } else {
      this.highStock = this.highStock.filter(item =>
        (item.stock_id && item.stock_id.toString() === value) ||
        (item.name && item.name.toLowerCase().includes(value)) ||
        (item.description && item.description.toLowerCase().includes(value)) ||
        (item.material?.material_name && item.material.material_name.toLowerCase().includes(value)) ||
        (item.stock_type?.type_name && item.stock_type.type_name.toLowerCase().includes(value))
      );
    }
  }

  viewStock(item: stock) {
    this.viewStockItem = item;
    this.showStockView = true;
    this.showCreateView = false;
    this.showUpdateView = false;
  }

  openCreateView(): void {
    this.showCreateView = true;
    this.showStockView = false;
    this.showUpdateView = false;
  }


  handleStockUpdate(updatedStock: stock): void {
    // Update the local stock array
    const index = this.allStock.findIndex(s => s.stock_id === updatedStock.stock_id);
    if (index !== -1) {
      this.allStock[index] = updatedStock;
    }

    this.lowStock = this.allStock.filter(item => item.stock_level < 50);
    this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
    this.highStock = this.allStock.filter(item => item.stock_level >= 250);

    this.showUpdateView = false;
  }

  private categorizeStock(): void {
  this.lowStock = this.allStock.filter(item => item.stock_level < 50);
  this.mediumStock = this.allStock.filter(item => item.stock_level >= 50 && item.stock_level < 250);
  this.highStock = this.allStock.filter(item => item.stock_level >= 250);
}

openUpdateView(item: stock): void {
  this.stockToUpdate = item;
  this.showUpdateView = true;
  this.showStockView = false;
  this.showCreateView = false;
}

  handleFormClose(): void {
    this.showCreateView = false;
    this.showStockView = false;
    this.showUpdateView = false;
    this.loadStock(); // Refresh data
  }

  loadMaterials(): void {
    this.apiService.get_materials().subscribe({
      next: (response) => {
        this.materials = response as material[];
      },
      error: (err) => {
        console.error('Error loading materials:', err);
      }
    });
  }

  loadStockTypes(): void {
    this.apiService.get_stock_types().subscribe({
      next: (response) => {
        this.stockTypes = response as stock_type[];
      },
      error: (err) => {
        console.error('Error loading stock types:', err);
      }
    });
  }
}
