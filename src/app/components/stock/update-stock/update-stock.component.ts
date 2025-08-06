import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { material, stock_type, stock } from '../../../models/stock';
import { AppModule } from '../../../app.module';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-update-stock',
  templateUrl: './update-stock.component.html',
  imports: [AppModule],
  styleUrls: ['./update-stock.component.less']
})
export class UpdateStockComponent implements OnInit {
  @Input() stockData!: stock;
  @Output() closeForm = new EventEmitter<void>();
  @Output() updateSuccess = new EventEmitter<stock>();

  stockForm: FormGroup;
  materials: material[] = [];
  stockTypes: stock_type[] = [];
  currentMaterial: material | null = null;
  currentStockType: stock_type | null = null;
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
      stock_level: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentValues();
  }

  loadCurrentValues(): void {
    this.isLoading = true;

    // Create an array of observables for the current values
    const requests = [];

    if (this.stockData.material_id) {
      requests.push(this.apiService.get_material(this.stockData.material_id));
    }

    if (this.stockData.stock_type_id) {
      requests.push(this.apiService.get_stock_type(this.stockData.stock_type_id));
    }

    if (requests.length === 0) {
      this.loadAllOptions();
      return;
    }

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        // Process results
        let materialIndex = 0;
        let typeIndex = 0;

        if (this.stockData.material_id) {
          this.currentMaterial = results[materialIndex++] as material;
        }

        if (this.stockData.stock_type_id) {
          this.currentStockType = results[typeIndex] as stock_type;
        }

        // Now load all options
        this.loadAllOptions();
      },
      error: (err) => {
        console.error('Error loading current values:', err);
        this.notification.showError('Error', 'Failed to load current values');
        this.isLoading = false;
      }
    });
  }

  loadAllOptions(): void {
    // Load all materials and stock types
    forkJoin([
      this.apiService.get_materials(),
      this.apiService.get_stock_types()
    ]).subscribe({
      next: ([materials, stockTypes]) => {
        this.materials = materials;
        this.stockTypes = stockTypes;

        // Filter out current values from the main lists
        if (this.currentMaterial) {
          this.materials = this.materials.filter(
            m => m.material_id !== this.currentMaterial!.material_id
          );
        }

        if (this.currentStockType) {
          this.stockTypes = this.stockTypes.filter(
            t => t.stock_type_id !== this.currentStockType!.stock_type_id
          );
        }

        // Populate form
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
    if (this.stockData) {
      this.stockForm.patchValue({
        name: this.stockData.name,
        description: this.stockData.description || '',
        material_id: this.stockData.material_id,
        stock_type_id: this.stockData.stock_type_id,
        stock_level: this.stockData.stock_level
      });
    }
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
      stock_level: formData.stock_level
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
