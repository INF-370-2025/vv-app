import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { material, stock_type, stock } from '../../../models/stock';
import { AppModule } from '../../../app.module';
import { catchError, forkJoin, of } from 'rxjs';
import { provideClientHydration } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-update-stock',
  templateUrl: './update-stock.component.html',
  imports: [AppModule],
  styleUrls: ['./update-stock.component.less']
})
export class UpdateStockComponent implements OnInit {
  @Input() stockData: any;
  @Output() closeForm = new EventEmitter<void>();
  @Output() updateSuccess = new EventEmitter<any>();

  stockForm: FormGroup;
  materials: any[] = [];
  stockTypes: any[] = [];
  isSubmitting = false;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.stockForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(255)],
      material_id: [null],
      stock_type_id: [null],
      stock_level: [0, [Validators.required, Validators.min(0)]],
      stock_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    this.isLoading = true;

    forkJoin([
      this.apiService.get_materials(),
      this.apiService.get_stock_types()
    ]).subscribe({
      next: ([materials, stockTypes]) => {
        this.materials = materials;
        this.stockTypes = stockTypes;
        this.populateForm();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading options:', err);
        this.notification.showError('Error', 'Failed to load options');
        this.isLoading = false;
      }
    });
  }

  populateForm(): void {
    const materialId = this.stockData.material_id ||
                      (this.stockData.material?.material_id);

    const stockTypeId = this.stockData.stock_type_id ||
                       (this.stockData.stock_type?.stock_type_id);

    this.stockForm.patchValue({
      name: this.stockData.name,
      description: this.stockData.description || '',
      material_id: materialId,
      stock_type_id: stockTypeId,
      stock_level: this.stockData.stock_level,
      stock_price: this.stockData.stock_price
    });
  }

  submitForm(): void {
    if (this.stockForm.invalid) {
      Object.values(this.stockForm.controls).forEach(control => {
        control.markAsTouched();
      });
      this.notification.showError('Error', 'Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;
    const formData = this.stockForm.value;

    const payload = {
      stock_id: this.stockData.stock_id,
      name: formData.name,
      description: formData.description,
      material_id: formData.material_id,
      stock_type_id: formData.stock_type_id,
      stock_level: formData.stock_level,
      stock_price: formData.stock_price
    };

    this.apiService.update_stock(payload).subscribe({
      next: (updatedStock) => {
        this.notification.showSuccess('Success', 'Stock updated successfully');
        this.updateSuccess.emit(updatedStock);
        this.closeForm.emit();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Update error:', err);
        this.notification.showError('Error', 'Failed to update stock');
        this.isSubmitting = false;
      }
    });
  }

  cancel(): void {
    this.closeForm.emit();
  }
}
