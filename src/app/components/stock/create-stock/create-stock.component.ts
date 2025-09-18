import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { AppModule } from '../../../app.module';
import { NotificationService } from '../../../services/notification.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { material, stock_type, CreateStock } from '../../../models/stock';

@Component({
  selector: 'app-create-stock',
  standalone: true,
  imports: [AppModule],
  templateUrl: './create-stock.component.html',
  styleUrls: ['./create-stock.component.less']
})
export class CreateStockComponent implements OnInit {
  @Output() closeForm = new EventEmitter<void>();
  @Input() preselectedTypeId: number | null = null;

  stockForm: FormGroup;
  materials: material[] = [];
  stockTypes: stock_type[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private notification: NotificationService
  ) {
    this.stockForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(255)],
      material_id: [null, Validators.required],
      stock_type_id: [null, Validators.required],
      stock_level: [0, [Validators.required, Validators.min(0)]],
      stock_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadMaterials();
    this.loadStockTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preselectedTypeId'] && this.preselectedTypeId) {
      this.stockForm.patchValue({
        stock_type_id: this.preselectedTypeId
      });
    }
  }

  loadMaterials(): void {
    this.apiService.get_materials().subscribe({
      next: (response: any[]) => {
        this.materials = response.map((m: material) => ({
          ...m,
          material_id: +m.material_id
        }));
      },
      error: (err) => {
        console.error('Error loading materials:', err);
        this.notification.showError('Error', 'Failed to load materials');
      }
    });
  }

  loadStockTypes(): void {
    this.apiService.get_stock_types().subscribe({
      next: (response: any[]) => {
        this.stockTypes = response.map((t: stock_type) => ({
          ...t,
          stock_type_id: +t.stock_type_id
        }));

        // After loading types, set the preselected type if provided
        if (this.preselectedTypeId) {
          this.stockForm.patchValue({
            stock_type_id: this.preselectedTypeId
          });
        }
      },
      error: (err) => {
        console.error('Error loading stock types:', err);
        this.notification.showError('Error', 'Failed to load stock types');
      }
    });
  }

  submitForm(): void {
    // Mark all fields as touched to trigger validation
    Object.values(this.stockForm.controls).forEach(control => {
      control.markAsTouched();
    });

    if (this.stockForm.valid) {
      this.isSubmitting = true;

      // Create payload with correct types
      const payload: CreateStock = {
        stock_id: 0,
        name: this.stockForm.value.name,
        description: this.stockForm.value.description,
        material_id: +this.stockForm.value.material_id,
        stock_type_id: +this.stockForm.value.stock_type_id,
        stock_level: +this.stockForm.value.stock_level,
        stock_price: +this.stockForm.value.stock_price
      };

      console.log('Submitting payload:', payload);

      this.apiService.create_stock(payload).subscribe({
        next: () => {
          this.notification.showSuccess('Success', 'Stock created successfully');
          this.closeForm.emit();
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Error creating stock:', err);

          // Handle validation errors
          if (err.status === 422 && err.error?.detail) {
            const errorMessages = err.error.detail.map((e: any) =>
              `${e.loc?.[1] || 'field'}: ${e.msg}`
            );
            this.notification.showError('Validation Error', errorMessages.join('<br>'));
          } else {
            this.notification.showError('Error', 'Failed to create stock');
          }

          this.isSubmitting = false;
        }
      });
    } else {
      console.warn('Form is invalid', this.stockForm.errors);
      this.notification.showError('Error', 'Please fill all required fields correctly');
    }
  }

  cancel(): void {
    this.closeForm.emit();
  }

}
